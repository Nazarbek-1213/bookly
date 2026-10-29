from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean,Enum,BigInteger
from pgvector.sqlalchemy import Vector
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import secrets
from enum import Enum as Acount
from dotenv import load_dotenv
import os 
from sqlalchemy.sql import func

load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Accounttype(Acount):
    PRIVATE_ACCOUNT = "private_account"
    PUBLIC_ACCOUNT = "public_account"

class FollowRequest(Acount):
    REQUESTED='requested'
    ACCEPTED='accepted'
    REJECTED='rejected'

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    image_url = Column(String, nullable=True)
    email = Column(String(100),nullable=True)
    password = Column(String(255))
    bio = Column(Text, nullable=True)
    account_type=Column(Enum(Accounttype),default=Accounttype.PUBLIC_ACCOUNT)
    created_at = Column(DateTime, default=datetime.now())
    
    tokens = relationship("Token", back_populates="user", cascade="all, delete-orphan")
    books = relationship("Book", back_populates="author")
    comments = relationship("Comment", back_populates="user")
    likes = relationship("Like", back_populates="user")
    followers_rel = relationship("Follower", foreign_keys="Follower.following_id", back_populates="following_user")
    following_rel = relationship("Follower", foreign_keys="Follower.follower_id", back_populates="follower_user")
    pdfbook=relationship('PDFbook',foreign_keys='PDFbook.uploaded_by',back_populates="user")

class Token(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True)
    token = Column(String(500), unique=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    device_info = Column(String(255))
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.now())
    expires_at = Column(DateTime, default=lambda: datetime.now() + timedelta(days=30))
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="tokens")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True)
    title = Column(String(255))
    description = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.now())
    image_url = Column(String, nullable=True)
    embedding=Column(Vector(1536),nullable=True)
    
    author = relationship("User", back_populates="books")
    comments = relationship("Comment", back_populates="book")
    likes = relationship("Like", back_populates="book")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    text = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.now())
    
    user = relationship("User", back_populates="comments")
    book = relationship("Book", back_populates="comments")

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.now())
    
    user = relationship("User", back_populates="likes")
    book = relationship("Book", back_populates="likes")

class Follower(Base):
    __tablename__ = "followers"
    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    created_at = Column(DateTime, default=datetime.now())
    status=Column(Enum(FollowRequest),default=FollowRequest.ACCEPTED)


    follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following_rel")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers_rel")

class OTP(Base):
    __tablename__='otpcodes'
    id=Column(Integer,primary_key=True, autoincrement=True)
    otpcode=Column(Integer,nullable=False)
    user_id=Column(Integer,ForeignKey('users.id',ondelete='CASCADE'))
    created_at=Column(DateTime,default=datetime.now)
    expiration_time = Column(DateTime,default=lambda: datetime.now() + timedelta(minutes=5))
    is_used=Column(Boolean,default=False)


class PDFbook(Base):
    __tablename__ = "pdfbooks"

    id = Column(Integer, primary_key=True, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    status = Column(String(20), nullable=False, default="processing")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", foreign_keys=[uploaded_by], back_populates="pdfbook")
    chunks = relationship("PDFchunk", back_populates="document", cascade="all, delete-orphan")

class PDFchunk(Base):
    __tablename__ = "pdfchunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("pdfbooks.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(Vector(1536), nullable=True)

    document = relationship("PDFbook", back_populates="chunks")

# Base.metadata.create_all(engine)
