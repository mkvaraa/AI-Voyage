from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from app.database.init_db import init_db  # noqa: E402
from app.errors import validation_exception_handler  # noqa: E402
from app.routers.health import router as health_router  # noqa: E402
from app.routers.routes import router as routes_router  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.exceptions import RequestValidationError  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from prometheus_fastapi_instrumentator import Instrumentator  # noqa: E402


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AI-Voyage API", lifespan=lifespan)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(routes_router, prefix="/api")
