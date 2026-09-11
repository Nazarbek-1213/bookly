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


UPLOAD_DIR = 'D:\\bookly\\uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def uploadpic (file:UploadFile):
    
    original_filename = file.filename
    file_ext=file.filename.split('.')[-1].lower()
    allowed_extensions=['jpg','jpeg','png','webp']
    if file_ext not in allowed_extensions:
              raise Exception('only picture formats supported')
    unique_filename=f'{uuid.uuid4()}.{file_ext}'
    upload_path = os.path.join(UPLOAD_DIR, unique_filename)
    contents = await file.read()
    async with aiofiles.open(original_filename, 'wb') as f:
     await f.write(contents)
    link = f"/uploads/{unique_filename}"    
    return link
