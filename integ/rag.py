import logging
import os 
import uuid
import aiofiles
from fastapi import UploadFile,APIRouter,Depends,HTTPException
from sqlalchemy import BigInteger
from depen import token_checker,db_dependency
from typing import Annotated
from database import Token,PDFbook,PDFchunk,Book,User,Accounttype
from datetime import datetime, timedelta
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from integ.embedding import create_pdf_embedding,create_embedding
from model import ChatRequest
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

router=APIRouter(prefix='/ai',tags=['ai'])


model=ChatOpenAI(
    model='gpt-5.4-nano',
    temperature=0
)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a helpful assistant for the Bookly application.

        Answer the user's question using only the provided context.
        If the context does not contain the answer, say that
        the uploaded documents do not provide enough information.

        Answer in the same language as the user's question.
        """
    ),
    (
        "human",
        """
        Context:
        {context}

        User question:
        {question}
        """
    )
])

answer_chain= prompt|model


def generate_answer(question:str,chunks):
    context='\n\n'.join(chunk.chunk_text for chunk in chunks)
    response=answer_chain.invoke(
        {
            'context':context,
            'question':question
        }
    )
    return response.content




def loader_pdf(path:str):
     loader=PyPDFLoader(path)
     document=loader.load()
     return document

def chunking_documents(documents:list[Document]):
    splitter=RecursiveCharacterTextSplitter(
          chunk_size=1000,
          chunk_overlap=200
     )
    chunks=splitter.split_documents(documents)
    clean_chunks = []

    for chunk in chunks:
        text = chunk.page_content.strip()

        if len(text) < 100:
            continue

        chunk.page_content = text
        clean_chunks.append(chunk)

    print("Asl chunklar:", len(chunks))
    print("Tozalangan chunklar:", len(clean_chunks))

    return clean_chunks



def search_similar(
    db,
    question_embedding: list[float],
    user_id: int,
    document_id:int,
    limit: int = 5,
   
):
    distance = PDFchunk.embedding.cosine_distance(question_embedding)

    result = (
        db.query(PDFchunk, distance.label("distance")).join(PDFbook, PDFchunk.document_id == PDFbook.id).filter(PDFbook.uploaded_by == user_id).filter(PDFbook.id==document_id)
        .filter(PDFchunk.embedding.is_not(None))
        .order_by(distance.asc())
        .limit(limit)
        .all()
    )
    for chunk, score in result:
        print(
            f"PDF ID: {chunk.document_id} | "
            f"CHUNK: {chunk.chunk_index} | "
            f"DISTANCE: {score:.4f} | "
            f"MATN: {chunk.chunk_text[:150]!r}"
        )
            
    return [chunk for chunk, score in result]




def similar_users(db,post_embedding=list[float],limit:int=5):
    result=db.query(Book).order_by(Book.embedding.cosine_distance(post_embedding)).limit(limit).all()
    private_user=db.query(User).join(Book,Book.author==User.id).filter(User.account_type==Accounttype.PRIVATE_ACCOUNT).all()
    if private_user:
        return []
    return result


import os
import tempfile
import uuid
from typing import Annotated

from fastapi import Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from depen import supabase  # o'zingizdagi import yo'liga moslang

logger = logging.getLogger(__name__)
MAX_PDF_SIZE = 20 * 1024 * 1024  # 20 MB
BUCKET_NAME = "bookly"


async def upload_pdf_to_supabase(contents: bytes, filename: str) -> str:
    bucket = supabase.storage.from_(BUCKET_NAME)
    path = f"pdf/{filename}"
    try:
        await run_in_threadpool(
            bucket.upload,
            path=path,
            file=contents,
            file_options={"content-type": "application/pdf"},
        )
        return f"storage://{BUCKET_NAME}/{path}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF yuklashda xatolik: {e}")


@router.post('/upload/pdf')
async def upload_pdf(
    file: Annotated[UploadFile, File()],
    token_obj: Annotated[Token, Depends(token_checker)],
    db: db_dependency,
):
    user = token_obj.user

    if not file.filename or file.filename.rsplit('.', 1)[-1].lower() != 'pdf':
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(status_code=413, detail="Max size 20 MB")

    unique_filename = f'{uuid.uuid4()}.pdf'

    # loader_pdf lokal yo'l so'raydi, shuning uchun vaqtinchalik fayl
    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp_path = tmp.name
    try:
        tmp.write(contents)
        tmp.close()

        try:
            docs = await run_in_threadpool(loader_pdf, tmp_path)
        except Exception as exc:
            logger.exception("Could not read uploaded PDF")
            raise HTTPException(
                status_code=422,
                detail="PDF faylini o'qib bo'lmadi. Fayl buzilmagan yoki parol bilan himoyalanmaganini tekshiring.",
            ) from exc
        chunked_docs = await run_in_threadpool(chunking_documents, docs)
        if not chunked_docs:
            raise HTTPException(
                status_code=422,
                detail="PDF ichidan matn topilmadi. Skan qilingan PDFlar hozircha qo'llab-quvvatlanmaydi.",
            )
        try:
            pdf_embedding = await run_in_threadpool(create_pdf_embedding, chunked_docs)
        except Exception as exc:
            logger.exception("Could not create embeddings for uploaded PDF")
            raise HTTPException(
                status_code=502,
                detail="PDF matnini qayta ishlash xizmati ishlamadi. OpenAI API sozlamalari va ulanishini tekshiring.",
            ) from exc
    finally:
        tmp.close()
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    pdf_url = await upload_pdf_to_supabase(contents, unique_filename)

    try:
        book = PDFbook(
            uploaded_by=user.id,
            title=file.filename,
            filename=unique_filename,
            file_path=pdf_url,
            file_size=len(contents),
        )
        db.add(book)
        db.flush()

        pdf_chunks = [
            PDFchunk(
                document_id=book.id,
                chunk_text=chunk.page_content,
                page_number=chunk.metadata.get('page'),
                chunk_index=index,
                embedding=pdf_embedding[index],
            )
            for index, chunk in enumerate(chunked_docs)
        ]
        db.add_all(pdf_chunks)
        db.commit()
        db.refresh(book)
        return book

    except Exception as e:
        db.rollback()
        # bazaga yozilmadi, Supabase'dagi faylni ham o'chiramiz
        await run_in_threadpool(
            supabase.storage.from_(BUCKET_NAME).remove, [f"pdf/{unique_filename}"]
        )
        raise HTTPException(status_code=500, detail=f"PDF qayta ishlashda xatolik: {e}")


@router.post('/chat')
def ai_chat(token_obj:Annotated[Token,Depends(token_checker)],text:ChatRequest,db:db_dependency,document_id:int):
     question=text.chat
     embedding=create_embedding(question)
     chunks=search_similar(db=db,question_embedding=embedding,user_id=token_obj.user_id,document_id=document_id,limit=5)
     ai_massege=generate_answer(question=question,chunks=chunks)


     return{
        "user_id":token_obj.user_id,
        "question":question,
        "messege":"accepted",
        "results":[{
                "chunk_id": chunk.id,
                "content": chunk.chunk_text,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index

        }
        for chunk in chunks],
        'answer':ai_massege
     }
      
