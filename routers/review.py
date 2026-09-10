from fastapi import APIRouter,Depends,HTTPException
from depen import db_dependency
from model import Comments
from database import Comment,Like,Token,Book,User
from depen import token_checker
from typing import Annotated

router=APIRouter(prefix='/review')

@router.post('/comment/{books_id}', response_model=Comments,tags=['review'])
def CommentPost(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,review:Comments,books_id:int):
    user=token_obj.user
    book=db.query(Book).filter(Book.id==books_id).first()
    if not book:
        raise HTTPException(
            status_code=400,
            detail='book not found'
        )
    kom=Comment(
        text=review.text,
        user_id=user.id,
        book_id=book.id
    )
    db.add(kom)
    db.commit()
    return kom

@router.delete('/delete/{book_id}',tags=['review'])
def deleteReview(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int):
    user=token_obj.user
    comment=db.query(Comment).filter(user.id==Comment.user_id,Comment.book_id==book_id).first()
    if not comment:
        raise HTTPException(
            status_code=400,
            detail='self-comment allowed'
        )
    
    db.delete(comment)
    db.commit()
    return comment

@router.put('/edit/{comment_id}',tags=['review'])
def deleteReview(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,comment_id:int,comment:Comments,book_id:int):
     user=token_obj.user
     comment_old=db.query(Comment).filter(user.id==Comment.user_id,Comment.id==comment_id,Comment.book_id==book_id).first()
     if not comment_old:
            raise HTTPException(
                status_code=400,
                detail='self-comment allowed'
            )
     comment_old.text=comment.text
     
     db.commit()
     db.refresh(comment_old)
     return comment_old

@router.get('/see/comments',tags=['review'])
def GetAll(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int):
     user=token_obj.user
     comment=db.query(Comment).filter(Comment.book_book_id).order_by(Comment.created_at.desc()).all()
     if user:
          return comment
     raise HTTPException(
          detail='auth required',
          status_code=400
     )

# =============== LIKE ======================

@router.post('/like/{book_id}',tags=['review'])
def LikePosts(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int):
     user=token_obj.user
     book=db.query(Book).filter(Book.id==book_id).first()
     if  not user:
          raise HTTPException(
               status_code=400,
               detail='auth required'
          )
     if not book:
          raise HTTPException(
               status_code=404,
               detail='not found book'
          )
     like=Like(
          user_id=user.id,
          book_id=book.id,
     )
     db.add(like)
     db.commit()
     return like


@router.delete('/like/{book_id}',tags=['review'])
def disLikePosts(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,book_id:int):
     user=token_obj.user
     like=db.query(Like).filter(Like.book_id==book_id,Like.user_id==user.id).first()
     if  not user:
          raise HTTPException(
               status_code=400,
               detail='auth required'
          )
     if not like:
          raise HTTPException(
               status_code=404,
               detail='not found like'
          )
     db.delete(like)
     db.commit()

     

     




    

