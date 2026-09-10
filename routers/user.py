from fastapi import APIRouter,Depends,HTTPException,Form
from depen import db_dependency
from model import UserIn,Profile,SessionResponse,UserInn,PrivateUserResponse,PublicUserResponse
from database import User,Token,Follower,Accounttype,Book
from depen import token_checker
from typing import Annotated

router=APIRouter(prefix='/user')

@router.get("/profile/me",tags=['user'],response_model=UserInn)
def profile(
    token_obj: Annotated[Token, Depends(token_checker)]
):
    return token_obj.user

@router.get('/search',response_model=PrivateUserResponse|PublicUserResponse, tags=['user'])
def searchUser(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],username:str):
    user=token_obj.user
    post_counts = db.query(Book).filter(search.id == Book.author_id).count()
    follower_count=db.query(Follower).filter(search.id==Follower.follower_id).count()
    following_count=db.query(Follower).filter(search.id==Follower.following_id).count()
    if user:

     search=db.query(User).filter(User.username==username.strip()).first()
     if not search:
         raise HTTPException(status_code=404,detail="User not found")
    
    if search.account_type==Accounttype.PRIVATE_ACCOUNT:
         return PrivateUserResponse(
             username=search.username,
             count_posts=post_counts,
             follower_count=follower_count,
             following_count=following_count
         )

    return PublicUserResponse(
         username=search.username,
         image_url=search.image_url,
         email=search.email,
         bio=search.bio,
         posts=search.books,
         count_posts=post_counts,
         follower_count=follower_count,
         following_count=following_count
     )

@router.post('/follow',tags=['user'])
def Follow_user(token_obj:Annotated[Token,Depends(token_checker)],following_id:int,db:db_dependency):
    follower_id=token_obj.user_id
    if follower_id==following_id:
        raise HTTPException(
            status_code=400,
            detail="you can't follow to yourself"
        )
    exists=db.query(Follower).filter(Follower.follower_id==follower_id,Follower.following_id==following_id).first()
    if exists:
        raise HTTPException(
            status_code=400,
            detail='followed already'
        )
    follow=Follower(following_id=following_id,follower_id=follower_id)
    db.add(follow)
    db.commit()
    return  {'messege':'follow succesfully'}

@router.delete('/unfollow',tags=['user'])
def UnFollow_user(token_obj:Annotated[Token,Depends(token_checker)],following_id:int,db:db_dependency):
    follower_id=token_obj.user_id
    if following_id==follower_id:
        raise HTTPException(
            status_code=400,
            detail='cant chase yoursalf'
        )
    exists=db.query(Follower).filter(Follower.follower_id==follower_id,Follower.following_id==following_id).first()
    if exists:
        db.delete(exists)
        db.commit()
        return {'massege':'unfollowed succesfully'}

    else:
       follow=Follower(following_id=following_id,follower_id=follower_id)
       db.add(follow)
       db.commit()
       return  {'messege':'follow succesfully'}
 
@router.post('/account-type/',tags=['user'])
def AccountType(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
    user=db.query(User).filter(User.id==token_obj.user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.account_type == Accounttype.PUBLIC_ACCOUNT:
        user.account_type=Accounttype.PRIVATE_ACCOUNT
        db.commit()
        db.refresh(user)
        return user

    if user.account_type == Accounttype.PRIVATE_ACCOUNT:
            user.account_type=Accounttype.PUBLIC_ACCOUNT
            db.commit()
            db.refresh(user)
            return user

@router.get('profile/{user_id}',tags=['user'])
def PrivateAccount(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,user_id:str):
    user=db.query(User).filter(User.id==user_id).first()  
    follower_count=db.query(Follower).filter(user.id==Follower.follower_id).count()
    following_count=db.query(Follower).filter(user.id==Follower.following_id).count()
    post_counts = db.query(Book).filter(user.id == Book.author_id).count()

    if not user:
             raise HTTPException(
                 status_code=400,
                 detail='user not found'
             )   
    if user.account_type==Accounttype.PRIVATE_ACCOUNT:
                return PrivateUserResponse(
                    username=user.username,
                    count_posts=post_counts,
                    following_count=following_count,
                    follower_count=following_count
                )
       
    return PublicUserResponse(
                username=user.username,
                image_url=user.image_url,
                email=user.email,
                bio=user.bio,
                posts=user.books,
                count_posts=post_counts,
                following_count=following_count,
                follower_count=follower_count       
            )



    
# ------------- SESSION ---------------------
@router.get('/sessions/all',tags=['Sessions'],response_model=list[SessionResponse])
def Sessionall(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
    user=token_obj.user
    ses=db.query(Token).filter(Token.user_id==user.id).all()
    return ses

@router.get('/sessions',tags=['Sessions'])
def Sessions(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
    user=token_obj.user
    ses=db.query(Token).filter(Token.user_id==user.id).count()
    return ses

@router.get('/sessions/{token_id}',tags=['Sessions'])
def Sessionone(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,token_id:str):
    ses=db.query(Token).filter(Token.id==token_id).first()
    return ses.device_info






            
        


    


