from fastapi import APIRouter,Depends,HTTPException
from depen import db_dependency
from model import Comments
from database import Comment,Like,Token,Book
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
    

