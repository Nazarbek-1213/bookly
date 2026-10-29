from database import SessionLocal
from sqlalchemy.orm import Session
from typing import Annotated
from fastapi import Depends,HTTPException,UploadFile,File
from database import Token,User
from datetime import datetime
from model import UserIn
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os
import shutil
from datetime import datetime
import uuid
import aiofiles

import os
from supabase import create_client, Client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"),
                          os.getenv("SUPABASE_KEY"))

def get_db():
    db=SessionLocal()
    try:
     yield db
    finally:
       db.close()
db_dependency=Annotated[Session,Depends(get_db)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def token_checker(db:db_dependency,token:Annotated[str,Depends(oauth2_scheme)]):
   token_obj=db.query(Token).filter(Token.token==token).first()
   if not token_obj:
      raise HTTPException(
         status_code=401,
         detail='not authenticate'
      )
   if token_obj.expires_at<datetime.now():
      raise HTTPException (
         status_code= 400,
         detail='token expired'
      )
   if not  token_obj.is_active:
      raise HTTPException (
         status_code= 400,
         detail='token deactivated'
      )
   return token_obj

import uuid
from fastapi import HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from supabase import Client

MAX_SIZE = 5 * 1024 * 1024
ALLOWED = {"jpg", "jpeg", "png", "webp"}
STORAGE_IMAGE_PREFIX = "storage://bookly/"


async def uploadpic(file: UploadFile, supabase: Client) -> str:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Fayl nomi yo'q")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail="Only jpg, jpeg, png, webp files are supported",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Fayl 5 MB dan katta")

    name = f"{uuid.uuid4()}.{ext}"
    bucket = supabase.storage.from_("bookly")

    try:
        await run_in_threadpool(
            bucket.upload,
            path=name,
            file=contents,
            file_options={"content-type": file.content_type},
        )
        return f"{STORAGE_IMAGE_PREFIX}{name}"
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Faylni yuklashda xatolik yuz berdi: {e}",
        )