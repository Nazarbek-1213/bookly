from fastapi import APIRouter,Depends,HTTPException
from depen import db_dependency
from model import UserIn,Private,BookResponce
from database import User,Token,Follower,Accounttype,Book
from depen import token_checker
from typing import Annotated

router=APIRouter(prefix='/post')

@router.post('/post',response_model=BookResponce,tags=['post'])
def SharePost(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book:BookResponce):
    user=token_obj.user
    posting=Book(
        title=book.title,
        description=book.description,
        author_id=user.id,
        image_url=book.image_url   
    )
    db.add(posting)
    db.commit()
    return posting

@router.delete('/delete/{book_id}',tags=['post'])
def DeletePost(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int):
    user=token_obj.user
    book=db.query(Book).filter(Book.id == book_id,Book.author_id==user.id).first()
    if not book:
        raise HTTPException(
            status_code=400,
            detail='it is not your post, or book not found'
        )

    db.delete(book)
    db.commit()
    return {
        'messege':'removed succesfully'
    }
   
@router.put('/put/{book_id}',response_model=BookResponce,tags=['post'])
def ChangeInfo(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int,book:BookResponce):
    user=token_obj.user
    bookid=db.query(Book).filter(Book.id==book_id,Book.author_id==user.id).first()
    if not bookid:
            raise HTTPException(
                status_code=400,
                detail='it is not your post or book not found')
    new=Book(
         title=book.title,
         description=book.description,
         author_id=user.id,
         image_url=book.image_url
    )
    db.add(new)
    db.commit()
    db.refresh(new)
    return new

@router.get('/see',response_model=list[BookResponce]| None ,tags=['post'])
def PostSee(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
  user=token_obj.user
  followed=db.query(Follower).filter(user.id==Follower.following_id).all()
  if not followed:
       return None
  f_ids=[]
  for f in followed:
      f_ids.append(f.following_id)      
  post=db.query(Book).filter(Book.author_id.in_(f_ids)).order_by(Book.created_at.desc()).all()
  return post




    




