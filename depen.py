from database import SessionLocal
from sqlalchemy.orm import Session
from typing import Annotated
from fastapi import Depends,HTTPException,UploadFile,File
from database import Token,User
from datetime import datetime
from model import UserIn
from fastapi.security import OAuth2PasswordBearer
import uuid
import firebase_admin
from firebase_admin import credentials,storage

cred=credentials.Certificate('firebase-key.json')
firebase_admin.initialize_app(cred,{
           'storageBucket': 'reab-53b5d.firebasestorage.app'

})
bucket = storage.bucket()

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

async def uploadpic(file:UploadFile=File(None)):
   firebase_url=None
   if file:
      allowed_extensions=['jpg','jpeg','png','webp']
      file_ext=file.filename.split('.')[-1].lower()
      if file_ext not in allowed_extensions:
         raise Exception('only picture formats supported')
      unique_filename=f'{uuid.uuid4()}.{file_ext}'
      contents=await file.read()
      blob=bucket.blob(unique_filename)
      blob.upload_from_string(contents,content_type=file.content_type)
      blob.make_public()
      firebase_url=blob.public_url
      return firebase_url
