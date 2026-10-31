from datetime import datetime, timedelta
from typing import Annotated
from dotenv import load_dotenv
from fastapi import Depends, APIRouter, HTTPException, status,Request,UploadFile,File,Form
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from database import User,Token,OTP,Book,Follower,FollowRequest,Accounttype
import secrets
from model import UserIn,Userdb,UserLogin,TokenInfo,Changepassword,Renewpassword
from depen import get_db,db_dependency,uploadpic,supabase,STORAGE_IMAGE_PREFIX
from depen import token_checker,uploadpic
import os
import random
import smtplib
import logging
import re


load_dotenv()

OTP_EXPIRE = timedelta(minutes=5)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")
router=APIRouter(prefix='/auth')
pwd_hasher = CryptContext(schemes=["argon2"], deprecated="auto")
logger = logging.getLogger(__name__)


def password_verifier(plain,password):
    return pwd_hasher.verify(plain,password)

def password_hasher(password:str):
    return pwd_hasher.hash(password)

def get_user_by_name(db:db_dependency,username:str):
   return db.query(User).filter(User.username==username).first()


@router.get("/image-url/{object_key}", tags=["auth"])
def get_image_url(
    object_key: str,
    db: db_dependency,
    token_obj: Annotated[Token, Depends(token_checker)],
):
    if not re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)", object_key):
        raise HTTPException(status_code=404, detail="Rasm topilmadi")

    image_refs = (
        f"{STORAGE_IMAGE_PREFIX}{object_key}",
        supabase.storage.from_("bookly").get_public_url(object_key),
    )
    owner = db.query(User).filter(User.image_url.in_(image_refs)).first()
    book = db.query(Book).filter(Book.image_url.in_(image_refs)).first()
    if owner is None and book is None:
        raise HTTPException(status_code=404, detail="Rasm topilmadi")

    image_owner = owner
    if book is not None:
        image_owner = db.query(User).filter(User.id == book.author_id).first()
    if image_owner is None:
        raise HTTPException(status_code=404, detail="Rasm topilmadi")

    can_view = image_owner.id == token_obj.user_id or image_owner.account_type == Accounttype.PUBLIC_ACCOUNT
    if not can_view:
        can_view = db.query(Follower.id).filter(
            Follower.follower_id == token_obj.user_id,
            Follower.following_id == image_owner.id,
            Follower.status == FollowRequest.ACCEPTED,
        ).first() is not None
    if not can_view:
        raise HTTPException(status_code=404, detail="Rasm topilmadi")

    try:
        signed = supabase.storage.from_("bookly").create_signed_url(object_key, 3600)
        signed_url = signed.get("signedURL")
        if not signed_url:
            raise ValueError("Supabase did not return a signed URL")
    except Exception as exc:
        logger.exception("Could not create a signed URL for a stored image")
        raise HTTPException(status_code=502, detail="Rasmga vaqtinchalik havola yaratilmadi") from exc

    return {"url": signed_url, "expires_in": 3600}



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


def user_has_verified_otp(db: db_dependency, user_id: int) :
    return db.query(OTP).filter(OTP.user_id == user_id, OTP.is_used == True).first() is not None


def send_otp_email(email: str, code: str):
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
      firebase_url= await uploadpic(file, supabase)
    new_user = User(
        username=username,
        image_url=firebase_url,
        email=email,
        password=password_hasher(password),
        bio=bio,
        
    )
    if len(username)<5:
        raise HTTPException(
            detail='minimum username length should be 5 characters',
            status_code=400        )

    db.add(new_user)
   

    create_otp=create_otp_user(email=email,db=db)
    send_otp=send_otp_email(email=email,code=(create_otp))
    if not send_otp:
           raise HTTPException(
              detail='otpda xatolik',
              status_code=500
           )    
    if not send_otp:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="OTP yuborishda xatolik"
        )
    
    db.commit()
    db.refresh(new_user)
    
    return {
     "username": new_user.username,
    "email": new_user.email,
    "bio": new_user.bio,
    "image_url": new_user.image_url,
    "status": "success",
    "message": f"OTP {email}'ga jo'natildi",
    "expires_in": "5 minutes",
}
   
       

@router.post('/verify-otp/',tags=['auth'])
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
           detail='otpda xatolik',
           status_code=500
       )
  
   if record.expiration_time<datetime.now():
      raise HTTPException(
          detail='resend code,code time expired',
          status_code=400
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
def Login(db:db_dependency,request:Request,login:UserLogin):   
   user=db.query(User).filter(User.username==login.username).first()
   if not  user:
      raise HTTPException(
         status_code=400,
         detail='registeration  needed'
      )
   if len(login.username)<5:
           raise HTTPException(
               detail='minimum username length should be 5 characters',
                  status_code=403   )

   otp_records = db.query(OTP).filter(OTP.user_id == user.id).first()
   if otp_records is not None and not user_has_verified_otp(db, user.id):
      raise HTTPException(
         status_code=403,
         detail='OTP verification required before login'
      )
   
   check_password=password_verifier(plain=login.password,password=user.password)
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
 

@router.post('/logout/',tags=['auth'])
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

@router.put('/edit/',tags=['auth'])
async def EditUser(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],username: str = Form(...),
    email: str = Form(...),
    bio: str = Form(None),
    file:UploadFile=File(None)):
    user=token_obj.user
    if user:
     if file is not None:   
      firebase_url= await uploadpic(file,supabase)
      user.image_url=firebase_url
     if username is not None:
      user.username=username
     if email is not None:    
      user.email=email
     if bio is not None:
      user.bio=bio
    if len(username)<5:
        raise HTTPException(
            detail='minimum username length should be 5 characters',
            status_code=400
        )
    db.commit()
    db.refresh(user)
    return user

@router.patch('/change-password/',tags=['auth'])
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


@router.post('/forgot-password/',tags=['auth'])
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