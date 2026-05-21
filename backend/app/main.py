from dotenv import load_dotenv

load_dotenv()

from app.database.init_db import init_db  # noqa: E402
from app.routers.health import router as health_router  # noqa: E402
from app.routers.placeholder import router as placeholder_router  # noqa: E402
from app.routers.routes import router as routes_router  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from prometheus_fastapi_instrumentator import Instrumentator  # noqa: E402

app = FastAPI(title="AI-Voyage API")

Instrumentator().instrument(app).expose(app)

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
