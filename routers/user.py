from fastapi import APIRouter,Depends,HTTPException
from depen import db_dependency
from model import UserIn,Private
from database import User,Token,Follower,Accounttype
from depen import token_checker
from typing import Annotated

router=APIRouter(prefix='/user')

@router.get("/profile/me",tags=['user'])
def profile(
    token_obj: Annotated[Token, Depends(token_checker)]
):
    return token_obj.user

@router.get('/search',response_model=UserIn,tags=['user'])
def searchUser(token_obj:Annotated[Token,Depends(token_checker)],username:str,db:db_dependency):
    token_obj=db.query(User).filter(User.username==username).first()
    return token_obj



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

@router.get('profile/{token_obj}',tags=['user'])
def PrivateAccount(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
    user=db.query(User).filter(User.id==token_obj.user_id).first()
    if user.account_type==Accounttype.PRIVATE_ACCOUNT:
        return User(
            username=user.username
            #count_posts: 
            
        )
    if user.account_type==Accounttype.PUBLIC_ACCOUNT:
        return User(
            username=user.username,
            image_url=user.image_url,
            email=user.email,
            bio=user.bio,
            # posts:
        )
    
# @router.get('post/')
        

# @router.get('/session',tags=['user'])
# def SessionCount(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
#     ses=db.query(Token).filter(Token.user_id==token_obj.user_id)
#     return {
#         ses.device_info
#     }

