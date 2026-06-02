import logging
import time

from app.database.crud import get_route_by_slug, save_route
from app.models.schemas import RouteResponse, TripRequest
from app.services.route_service import generate_route
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(tags=["routes"])


@router.post("/route", response_model=RouteResponse)
async def create_route(trip: TripRequest):
    start_time = time.perf_counter()
    logger.info("POST /route received: destination=%s", trip.destination)

    route = await generate_route(trip)
    slug = await save_route(route)
    route.slug = slug

    elapsed = time.perf_counter() - start_time
    logger.info(
        "POST /route done: destination=%s slug=%s took=%.2fs",
        trip.destination,
        slug,
        elapsed,
    )

    return route


@router.get("/route/{slug}", response_model=RouteResponse)
async def read_route(slug: str):
    data = await get_route_by_slug(slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return RouteResponse(**{**data, "slug": slug})
