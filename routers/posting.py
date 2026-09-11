from fastapi import APIRouter,Depends,HTTPException,UploadFile,File,Form
from depen import db_dependency,uploadpic,token_checker
from model import UserIn,Private,BookResponce
from database import User,Token,Follower,Accounttype,Book
from typing import Annotated


router=APIRouter(prefix='/post')

@router.post('/post',response_model=BookResponce,tags=['post'])
async def SharePost(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,
              title:str=Form(...),description:str=Form(...),file:UploadFile=File(...)):
    user=token_obj.user
    post_url=await uploadpic(file)
    posting=Book(
        title=title,
        description=description,
        author_id=user.id,
        image_url=post_url  
    )
    db.add(posting)
    db.commit()
    return posting

@router.delete('/delete/{book_id}',tags=['post'])
def DeletePost(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int):
    book=db.query(Book).filter(Book.id == book_id,Book.author_id==token_obj.user_id).first()
    if not book:
        raise HTTPException(
            status_code=403,
            detail='it is not your post, or book not found'
        )

    db.delete(book)
    db.commit()
    return {
        'messege':'removed succesfully'
    }
   
@router.put('/put/{book_id}',response_model=BookResponce,tags=['post'])
async def ChangeInfo(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int,title:str=Form(...),description:str=Form(...),file:UploadFile=File(...)):
    bookid=db.query(Book).filter(Book.id==book_id,Book.author_id==token_obj.user_id).first()
    if not bookid:
            raise HTTPException(
                status_code=403,
                detail='it is not your post or book not found')
    firebase_url=await uploadpic(file)
    bookid.title=title,
    bookid.description=description,
    bookid.image_url=firebase_url
    db.commit()
    db.refresh(bookid)
    return bookid

@router.get('/see',response_model=list[BookResponce]| None ,tags=['post'])
def PostSee(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
  user=token_obj.user
  followed=db.query(Follower).filter(user.id==Follower.follower_id).all()
  if not followed:
       return []
  f_ids=[]
  for f in followed:
      f_ids.append(f.following_id)      
  post=db.query(Book).filter(Book.author_id.in_(f_ids)).order_by(Book.created_at.desc()).all()
  return post




    




