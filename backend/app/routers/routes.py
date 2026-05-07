import json
import secrets
from datetime import date, timedelta

import aiosqlite
from fastapi import APIRouter, Depends

from app.database.connection import get_db
from app.models.schemas import Day, RouteResponse, Stop, TripRequest

router = APIRouter(tags=["routes"])


class RouteResponseWithSlug(RouteResponse):
    slug: str


def _build_hardcoded_route(req: TripRequest) -> RouteResponse:
    start = req.start_date
    return RouteResponse(
        title=f"3 Days in {req.destination}",
        days=[
            Day(
                day=1,
                date=start,
                stops=[
                    Stop(
                        id="s1",
                        name="Colosseum",
                        type="landmark",
                        lat=41.8902,
                        lng=12.4922,
                        duration_minutes=120,
                        notes="Book skip-the-line tickets in advance",
                        booking_url="https://example.com/colosseum",
                    ),
                    Stop(
                        id="s2",
                        name="Roman Forum",
                        type="landmark",
                        lat=41.8925,
                        lng=12.4853,
                        duration_minutes=90,
                        notes="Included with Colosseum ticket",
                        booking_url="",
                    ),
                ],
            ),
            Day(
                day=2,
                date=start + timedelta(days=1),
                stops=[
                    Stop(
                        id="s3",
                        name="Vatican Museums",
                        type="museum",
                        lat=41.9065,
                        lng=12.4536,
                        duration_minutes=180,
                        notes="Arrive early to avoid crowds",
                        booking_url="https://example.com/vatican",
                    ),
                    Stop(
                        id="s4",
                        name="Trevi Fountain",
                        type="landmark",
                        lat=41.9009,
                        lng=12.4833,
                        duration_minutes=30,
                        notes="Best visited at night",
                        booking_url="",
                    ),
                ],
            ),
            Day(
                day=3,
                date=start + timedelta(days=2),
                stops=[
                    Stop(
                        id="s5",
                        name="Trastevere Food Tour",
                        type="food",
                        lat=41.8867,
                        lng=12.4692,
                        duration_minutes=150,
                        notes="Guided walking food tour",
                        booking_url="https://example.com/trastevere",
                    ),
                ],
            ),
        ],
        total_budget_estimate=1200.0,
        currency="USD",
    )


@router.post("/route", response_model=RouteResponseWithSlug)
async def create_route(
    trip: TripRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    route = _build_hardcoded_route(trip)
    slug = secrets.token_urlsafe(6)

    await db.execute(
        "INSERT INTO routes (slug, data_json) VALUES (?, ?)",
        (slug, route.model_dump_json()),
    )
    await db.commit()

    return RouteResponseWithSlug(slug=slug, **route.model_dump())
