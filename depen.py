from database import SessionLocal
from sqlalchemy.orm import Session
from typing import Annotated
from fastapi import Depends,HTTPException
from database import Token,User
from datetime import datetime
from model import Private
def get_db():
    db=SessionLocal()
    try:
     yield db
    finally:
       db.close()
db_dependency=Annotated[Session,Depends(get_db)]

def token_checker(db:db_dependency,token:str):
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





