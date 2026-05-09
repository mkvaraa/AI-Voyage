from app.database.init_db import init_db
from app.routers.health import router as health_router
from app.routers.placeholder import router as placeholder_router
from app.routers.routes import router as routes_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI-Voyage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(placeholder_router)
app.include_router(health_router, prefix="/api")
app.include_router(routes_router, prefix="/api")


@app.on_event("startup")
async def startup():
    await init_db()
