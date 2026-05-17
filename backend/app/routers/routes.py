import logging
import secrets
import time

from aiosqlite import IntegrityError
from app.database.crud import save_route
from app.models.schemas import RouteResponse, TripRequest
from app.services.route_service import generate_route
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(tags=["routes"])

MAX_SLUG_ATTEMPTS = 5


class RouteResponseWithSlug(RouteResponse):
    slug: str


@router.post("/route", response_model=RouteResponseWithSlug)
async def create_route(trip: TripRequest):
    start_time = time.perf_counter()
    logger.info("POST /route received: destination=%s", trip.destination)

    route = await generate_route(trip)

    for _ in range(MAX_SLUG_ATTEMPTS):
        slug = secrets.token_urlsafe(6)
        try:
            await save_route(slug, route)
            break
        except IntegrityError:
            continue
    else:
        raise HTTPException(
            status_code=500,
            detail="Could not generate a unique slug, please retry",
        )

    elapsed = time.perf_counter() - start_time
    logger.info(
        "POST /route done: destination=%s slug=%s took=%.2fs",
        trip.destination,
        slug,
        elapsed,
    )

    return RouteResponseWithSlug(slug=slug, **route.model_dump())
