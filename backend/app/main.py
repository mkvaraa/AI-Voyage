from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.placeholder import router as placeholder_router

app = FastAPI(title="AI-Voyage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(placeholder_router)
