from fastapi import FastAPI
from routers.auth import router as auth_router
from routers.user import router as user_router
from routers.posting import router as posting_router
from routers.review import router as review_router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
from fastapi.staticfiles import StaticFiles
   
import os
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.mount(
    "/uploads",
    StaticFiles(directory=os.path.join(BASE_DIR, "uploads")),
    name="uploads"
)

app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:8080", "http://localhost:5500"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(posting_router)
app.include_router(review_router)










   
   


