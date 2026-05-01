from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["placeholder"])


@router.get("/health")
async def health_check():
    return {"status": "ok"}
