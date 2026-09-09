from datetime import datetime, timedelta
from typing import Annotated
from dotenv import load_dotenv
from fastapi import Depends, APIRouter, HTTPException, status,Request,UploadFile,File
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from database import User,Token
import secrets
from model import UserIn,Userdb,UserLogin,TokenInfo,Changepassword
from depen import get_db,db_dependency
from depen import token_checker

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
router=APIRouter(prefix='/auth')
pwd_hasher = CryptContext(schemes=["argon2"], deprecated="auto")


def password_verifier(plain,password):
    return pwd_hasher.verify(plain,password)

def password_hasher(password:str):
    return pwd_hasher.hash(password)

def get_user_by_name(db:db_dependency,username:str):
   return db.query(User).filter(User.username==username).first()

def re_enter_pswd(password1:str,password2:str):
   if password1==password2:
      return True
   else:
      raise HTTPException(
         status_code=400,
         detail='2 password should be same'
      )
    
@router.post("/registration/", response_model=UserIn,tags=['auth'])
def create_user(db: db_dependency, user: Userdb):

    old_user = get_user_by_name(
        db=db,
        username=user.username
    )

    if old_user:
        raise HTTPException(
            status_code=400,
            detail="This username already taken"
        )

    re_enter_pswd(
        password1=user.password,
        password2=user.password2
    )

   
    new_user = User(
        username=user.username,
        image_url=user.image_url,
        email=user.email,
        password=password_hasher(user.password),
        bio=user.bio
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


    


@router.post('/login',response_model=TokenInfo,tags=['auth'])
def Login(db:db_dependency,username:str,password:str,request:Request):   
   user=db.query(User).filter(User.username==username).first()
   if not  user:
      raise HTTPException(
         status_code=400,
         detail='registeration  needed'
      )   
   
   check_password=password_verifier(plain=password,password=user.password)
   if not check_password:
      raise HTTPException(
         status_code=400,
         detail='incorrect password'
      )
   
   
   token = secrets.token_urlsafe(32)
   device_info=request.headers.get('user-agent')
   ip_address=request.client.host

   token_gen=Token(
        token=token,
        device_info=device_info,
        ip_address=ip_address,
        user_id=user.id
      )
   
   db.add(token_gen)
   db.commit()
   db.refresh(token_gen)
   return token_gen
 

@router.post('/logout',tags=['auth'])
def Logout(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)]):
       token_obj.is_active=False
       db.commit()
       db.refresh(token_obj)
       return {"logged_out":True}

@router.delete('/delete-account/{token_obj}',tags=['auth'])
def Logout(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)]):
    user=token_obj.user
    db.delete(user)
    db.commit()
    return {
        'messege':'account deleted successfully'
    }

@router.put('/EditInfo/{token_obj}',tags=['auth'],response_model=UserIn)
def EditUser(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],new_user:UserIn):
    user=token_obj.user
    user.username=new_user.username
    user.image_url=new_user.image_url
    user.email=new_user.email
    user.bio=new_user.bio
    db.commit()
    db.refresh(user)
    return user

@router.patch('/change-password/d{token_obj.user_id}',tags=['auth'])
def PasswordChange(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],password:Changepassword):
    user=token_obj.user
    if not password.password==password.password2:
        raise HTTPException(
            status_code=400,
            detail='2 password should be same'
        ) 
    with_old_pswd=password_verifier(plain=password.old_password,password=user.password)
    if not with_old_pswd:
        raise HTTPException(
            status_code=400,
            detail='oldpassword incorrect'
        )
    user.password=password_hasher(password.password)
    db.commit()
    db.refresh(user)
    return user





    
        





