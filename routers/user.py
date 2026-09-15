from fastapi import APIRouter,Depends,HTTPException,Form
from depen import db_dependency
from model import UserIn,Profile,SessionResponse,UserInn,PrivateUserResponse,PublicUserResponse
from database import User,Token,Follower,Accounttype,Book,FollowRequest
from depen import token_checker
from typing import Annotated
from sqlalchemy import func
router=APIRouter(prefix='/user')

@router.get("/profile/me",tags=['user'],response_model=UserInn)
def profile(
    token_obj: Annotated[Token, Depends(token_checker)],db:db_dependency
):
    follower_count=db.query(Follower).filter(token_obj.user_id==Follower.following_id).count()
    following_count=db.query(Follower).filter(token_obj.user_id==Follower.follower_id).count()
    post_count=db.query(Book).filter(token_obj.user_id==Book.author_id).count()
    user=token_obj.user
    return UserInn(
         username=user.username,
         bio=user.bio,
         image_url=user.image_url,
         follower_count=follower_count,
         following_count=following_count,
         post_count=post_count,
         account_type=user.account_type,
         posts=[
            {    'id':book.id,
                 'title':book.title,
                 'description':book.description,
                 'image_url':book.image_url,
                 'author_id':book.author_id
                 
            }
            for book in user.books
         ]
           )

@router.get('/search',response_model=PrivateUserResponse|PublicUserResponse, tags=['user'])
def searchUser(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)],username:str):
    user=token_obj.user
    post_counts = db.query(Book).filter(search.id == Book.author_id).count()
    follower_count=db.query(Follower).filter(search.id==Follower.follower_id).count()
    following_count=db.query(Follower).filter(search.id==Follower.following_id).count()

    if user:

     search=db.query(User).filter(User.username==username.strip()).first()
     a=search.id
     current_user=db.query(Follower).filter(Follower.follower_id==a,Follower.status==FollowRequest.ACCEPTED,Follower.following_id==user.id)

     if not search:
         raise HTTPException(status_code=404,detail="User not found")
    
    if search.account_type==Accounttype.PUBLIC_ACCOUNT or current_user:
         
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
    elif search.account_type==Accounttype.PRIVATE_ACCOUNT:
         
         return PrivateUserResponse(
             username=search.username,
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
    following=db.query(User).filter(User.id==following_id).first()
    if following.account_type==Accounttype.PRIVATE_ACCOUNT:
         follow.status=FollowRequest.REQUESTED
         if not following:
              raise HTTPException(
                   detail='user nor found'
              )
    else:
         follow.status=FollowRequest.ACCEPTED
    db.add(follow)
    db.commit()
    return  {'messege':'followed'}

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

   
 
@router.patch('/account-type/',tags=['user'])
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
            db.query(Follower).filter(Follower.following_id==user.id,Follower.status==FollowRequest.REQUESTED).update({Follower.status:FollowRequest.ACCEPTED},synchronize_session=False)
            db.commit()
            db.refresh(user)
            return user.account_type
    

@router.get('profile/{user_id}',tags=['user'])
def GetAccountInfo(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,user_id:str):
    user=db.query(User).filter(User.id==user_id).first()  
    follower_count=db.query(Follower).filter(user.id==Follower.following_id).count()
    following_count=db.query(Follower).filter(user.id==Follower.follower_id).count()
    post_counts = db.query(Book).filter(user.id == Book.author_id).count()
    current_user=db.query(Follower).filter(Follower.follower_id==user_id,Follower.status==FollowRequest.ACCEPTED)

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
    elif user.account_type==Accounttype.PUBLIC_ACCOUNT_ACCOUNT or current_user:
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
    
         

@router.get("/top-followed")
async def TopFollowed(db:db_dependency,token_obj:Annotated[Token,Depends(token_checker)]):
    
    
    results = db.query(User.id,User.username,User.image_url,func.count(Follower.id).label('follower_count')).outerjoin(Follower,Follower.following_id == User.id).group_by(User.id).order_by(func.count(Follower.id).desc()).limit(10).all()
    
    if not results:
        return {"users": []}
    
    return {
        "users": [
            {
                "rank": idx + 1,
                "user_id": r[0],
                "username": r[1],
                "image_url": r[2],
                "followers": r[3]
            }
            for idx, r in enumerate(results)
        ]
    }

@router.get('/Followers/{user_id}/list')
def GetAllFollowers(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,user_id:int):
     current_user=db.query(User).join(Follower,Follower.following_id==User.id).filter(Follower.following_id==user_id).order_by(Follower.created_at.desc()).all()
     if not current_user:
          raise HTTPException(
               status_code=403,
               detail='not found'
          )
     return [
               {
                    'username':user.username,
                    'image_url':user.image_url
               }
               for  user in current_user
          ]
     

@router.get('/Followigs/{user_id}/list')
def GetAllFollowings(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency,user_id:int):
     current_user=db.query(User).join(Follower,User.id==Follower.following_id).filter(Follower.follower_id==user_id).order_by(Follower.created_at.desc()).all()
     if not current_user:
          raise HTTPException(
               status_code=403,
               detail='not found'
          )
     return [
          {
               'username':user.username,
               'image_url':user.image_url
          }
          for  user in current_user
     ]

@router.get('/Followers/me/list')
def GetAllFollowersme(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
     me=db.query(User).join(Follower,Follower.following_id==User.id).filter(Follower.following_id==token_obj.user_id).order_by(Follower.created_at.desc()).all()
     if not me:
          return []     
     return [
          {
               'username':user.username,
               'image_url':user.image_url          }
               for  user in me
     ]

@router.get('/Followings/me/list')
def GetAllFollowingsme(token_obj:Annotated[Token,Depends(token_checker)],db:db_dependency):
     me=db.query(User).join(Follower,Follower.following_id==User.id).filter(Follower.follower_id==token_obj.user_id).order_by(Follower.created_at.desc()).all()
     if not me:
          return []
     return [
          {
               "username":user.userame,
               "image_url":user.image_url
          }
          for user in me
     ]
     
     
     
     

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






            
        


    


