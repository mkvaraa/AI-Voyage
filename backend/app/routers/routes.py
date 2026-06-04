import logging
import time

from app.database.crud import get_route_by_slug, save_route, update_route
from app.models.schemas import ReplaceStopRequest, RouteResponse, TripRequest
from app.services.route_service import generate_route, replace_single_stop
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


@router.patch("/route/{slug}/replace", response_model=RouteResponse)
async def replace_stop(slug: str, payload: ReplaceStopRequest):
    start_time = time.perf_counter()
    logger.info(
        "PATCH /route/%s/replace: stop_id=%s day=%d",
        slug,
        payload.stop_id,
        payload.day,
    )

    data = await get_route_by_slug(slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Route not found")

    route = RouteResponse(**{**data, "slug": slug})

    target_day = next((d for d in route.days if d.day == payload.day), None)
    if target_day is None:
        raise HTTPException(
            status_code=404, detail=f"Day {payload.day} not found"
        )
    stop_index = next(
        (i for i, s in enumerate(target_day.stops) if s.id == payload.stop_id),
        None,
    )
    if stop_index is None:
        raise HTTPException(
            status_code=404,
            detail=f"Stop {payload.stop_id} not found in day {payload.day}",
        )

    new_stop = await replace_single_stop(
        route, payload.stop_id, payload.day, payload.preferences
    )
    target_day.stops[stop_index] = new_stop

    await update_route(slug, route)

    elapsed = time.perf_counter() - start_time
    logger.info(
        "PATCH /route/%s/replace done: stop_id=%s took=%.2fs",
        slug,
        payload.stop_id,
        elapsed,
    )

    return route
