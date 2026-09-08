from fastapi import FastAPI
from routers.auth import router as auth_router
from routers.user import router as user_router
from routers.posting import router as posting_router
from routers.review import router as review_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(posting_router)
app.include_router(review_router)










   
   


