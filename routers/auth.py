from datetime import datetime, timedelta
from typing import Annotated
from dotenv import load_dotenv
from fastapi import Depends, APIRouter, HTTPException, status,Request,UploadFile,File,Form
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from database import User,Token,OTP
import secrets
from model import UserIn,Userdb,UserLogin,TokenInfo,Changepassword,Renewpassword
from depen import get_db,db_dependency
from depen import token_checker,uploadpic
import os
import random
import smtplib


load_dotenv()

OTP_EXPIRE = timedelta(minutes=5)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
router=APIRouter(prefix='/auth')
pwd_hasher = CryptContext(schemes=["argon2"], deprecated="auto")


def password_verifier(plain,password):
    return pwd_hasher.verify(plain,password)

def password_hasher(password:str):
    return pwd_hasher.hash(password)

def get_user_by_name(db:db_dependency,username:str):
   return db.query(User).filter(User.username==username).first()



def generete_otp():
    return random.randint(100000,999999)

def create_otp_user(email:str,db:db_dependency):
   user=db.query(User).filter(User.email==email).first()
   if  not user:
      raise HTTPException(
         status_code=400,
         detail='email not found'
      )
   usercode=generete_otp()
   code=OTP( otpcode=usercode,
            user_id=user.id)
   db.add(code)
   db.commit()
   return usercode


def send_otp_email(email: str, code: str) -> bool:
    subject = "Your OTP Code"
    body = f"Your OTP code is: {code}\nExpires in 5 minutes."
    message = f"Subject: {subject}\n\n{body}"
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, email, message)
        return True
    except Exception as e:
        print(f"SMTP error: {e}")
        return False  
   

def re_enter_pswd(password1:str,password2:str):
   if password1==password2:
      if len(password1)<8:
         raise HTTPException(
            status_code=403,
            detail='the password length should be at least 8 characters'
         )
      
      return True
   else:
      raise HTTPException(
         status_code=400,
         detail='2 password should be same'
      )
    
@router.post("/registration/",response_model=UserIn,tags=['auth'])
async def create_user( db: db_dependency,
        username: str = Form(...),
    email: str = Form(...),
    bio: str = Form(None),
    password: str = Form(...),
    password2: str = Form(...),
    file: UploadFile = File(None),
                       ):

    old_user = get_user_by_name(
        db=db,
        username=username
    )

    if old_user:
        raise HTTPException(
            status_code=400,
            detail="This username already taken"
        )

    re_enter_pswd(
        password1=password,
        password2=password2
    )
    if password==username or password==email[0:-10]:
       raise HTTPException(
          status_code=403,
          detail='password should be different from username or email'
       ) 
    
   
    firebase_url=None
    if file:       
      firebase_url= await uploadpic(file)
    new_user = User(
        username=username,
        image_url=firebase_url,
        email=email,
        password=password_hasher(password),
        bio=bio,
        
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_otp=create_otp_user(email=email,db=db)
    send_otp=send_otp_email(email=email,code=(create_otp))
    if not send_otp:
           raise HTTPException(
              detail='otpda xatolik'
           )    
    

    return {
           "status": "success",
           "message": f"OTP {email}'ga jo'natildi",
           "expires_in": "5 minutes",
       }

@router.post('/verify-otp',tags=['auth'])
def validate_otp(db:db_dependency,email:str,code:int,password:Renewpassword):
   user=db.query(User).filter(User.email==email).first()
   if not user:
         raise HTTPException(
            status_code=403,
            detail='resend otp'
         )

   record=db.query(OTP).filter(OTP.is_used==False,OTP.user_id==user.id,OTP.otpcode==code).first()
   if not record:
       raise HTTPException(
           detail='otpda xatolik'
       )
  
   if record.expiration_time<datetime.now():
      raise HTTPException(
          detail='resend code,code time expired'
      )     
   record.is_used = True
   db.commit()
  
   if  password.password!=password.password2:
           raise HTTPException(
               status_code=400,
               detail='2 password should be same'
           ) 
     
   user.password=password_hasher(password.password)
   db.commit()
   db.refresh(user)
   return {
        "status": "success",
        "message": "Email muvaffaqiyatli tasdiqlandi"
    }


@router.post('/login',response_model=TokenInfo,tags=['auth'])
def Login(db:db_dependency,request:Request,username:str=Form(...),password:str=Form(...)):   
   user=db.query(User).filter(User.username==username).first()
   if not user:
         raise HTTPException(
            status_code=403,
            detail='resend otp'
         )
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

@router.delete('/delete-account',tags=['auth'])
def Logout(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)]):
    user=token_obj.user
    db.delete(user)
    db.commit()
    return {
        'messege':'account deleted successfully'
    }

@router.put('/EditInfo',tags=['auth'],response_model=UserIn)
async def EditUser(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],username: str = Form(...),
    email: str = Form(...),
    bio: str = Form(None),
    file:UploadFile=File(None)):
    user=token_obj.user
    firebase_url= await uploadpic(file)
    user.username=username
    user.image_url=firebase_url
    user.email=email
    user.bio=bio
    db.commit()
    db.refresh(user)
    return user

@router.patch('/change-password',tags=['auth'])
def PasswordChange(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],password:Changepassword):
    user=token_obj.user
    if user:
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


@router.post('/forgot-password',tags=['auth'])
def ForgotPswd(db:db_dependency,username:str):
     user=db.query(User).filter(User.username==username).first()
     if not user:
        raise HTTPException(
            status_code=400,
            detail='user not found'
        )
     otp_create=create_otp_user(email=user.email,db=db)
     send_otp=send_otp_email(email=user.email,code=(otp_create))
     if not send_otp:
           raise HTTPException(
               status_code=500,
              detail='otpda xatolik'                      
                                   )   
     return {
                "status": "success",
                "message": f"OTP {user.email[4:-1]}'ga jo'natildi",
                "expires_in": "5 minutes",
            }



    







    
        





