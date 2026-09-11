from pydantic import BaseModel,Field,field_validator
from enum import Enum as PyEnum
from datetime import datetime
from fastapi import UploadFile
class Accounttype(PyEnum):
    PRIVATE_ACCOUNT = "private_account"
    PUBLIC_ACCOUNT = "public_account"

class UserIn(BaseModel):
    username:str=Field(min_length=5)
    email:str
    bio:str=Field(default=None, max_length=300)
    image_url:str|None

class Userdb(UserIn):
    password:str=Field(min_length=8, max_length=29)
    password2:str=Field(min_length=8, max_length=29)

class UserLogin(BaseModel):
    username:str
    password:str
class TokenInfo(BaseModel):
    token:str
    device_info:str
    ip_address:str
class Profile(BaseModel):
    username:str
    image:str
class Private(BaseModel):
    username:str
    count_post:int
class Changepassword(BaseModel):
    password:str=Field(min_length=8, max_length=29)
    password2:str=Field(min_length=8, max_length=29)
    old_password:str
class BookResponce(BaseModel):
    title:str
    description:str
    image_url:str
class Comments(BaseModel):
    text:str
class SessionResponse(BaseModel):
    device_info:str
    created_at:datetime
class UserInn(BaseModel):
    username:str=Field(min_length=5)
    bio:str=Field(default=None, max_length=300)
    image_url:str
    follower_count:int
    following_count:int
    post_count:int
class PublicUserResponse(BaseModel):
    username: str
    image_url: str | None = None
    email: str | None = None
    bio: str | None = None
    posts: list = []
    count_posts: int 
    follower_count:int
    following_count:int
class PrivateUserResponse (BaseModel):
    username:str
    count_posts:int
    follower_count:int
    following_count:int