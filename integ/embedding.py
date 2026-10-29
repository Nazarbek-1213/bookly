from dotenv import load_dotenv
load_dotenv()

from langchain_openai import OpenAIEmbeddings


embedding_model=OpenAIEmbeddings(
    model='text-embedding-3-small',
    dimensions=1536
)

def create_embedding(text:str):
    return embedding_model.embed_query(text)


def create_pdf_embedding(chunks):
    texts=[chunk.page_content for chunk in chunks]
    embeddings=embedding_model.embed_documents(texts)
    return embeddings
