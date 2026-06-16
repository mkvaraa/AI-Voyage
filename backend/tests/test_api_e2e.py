"""End-to-end API tests using FastAPI's TestClient.

Gemini calls are mocked at the router boundary
(``app.routers.routes.generate_route`` / ``replace_single_stop``) so these
tests never hit the real Gemini API.
"""

from __future__ import annotations

import pytest

from app.models.schemas import Day, RouteResponse, Stop


VALID_TRIP_PAYLOAD = {
    "destination": "Rome",
    "start_date": "2025-07-01",
    "end_date": "2025-07-03",
    "budget": 1000,
    "interests": ["history", "food"],
}


def _make_route(title: str = "Rome Adventure") -> RouteResponse:
    """Build a deterministic RouteResponse used as the fake Gemini output."""
    return RouteResponse(
        title=title,
        days=[
            Day(
                day=1,
                date="2025-07-01",
                stops=[
                    Stop(
                        id="stop_001",
                        name="Colosseum",
                        type="landmark",
                        lat=41.8902,
                        lng=12.4922,
                        duration_minutes=120,
                        notes="Book skip-the-line tickets",
                        booking_url="https://colosseum.example.com",
                    ),
                    Stop(
                        id="stop_002",
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
                date="2025-07-02",
                stops=[
                    Stop(
                        id="stop_003",
                        name="Vatican Museums",
                        type="museum",
                        lat=41.9065,
                        lng=12.4536,
                        duration_minutes=180,
                        notes="Arrive early to avoid queues",
                        booking_url="https://vatican.example.com",
                    ),
                ],
            ),
        ],
        total_budget_estimate=850.0,
        currency="USD",
    )


@pytest.fixture
def mock_generate_route(monkeypatch):
    """Replace ``generate_route`` in the routes router with an async stub."""

    async def _fake_generate_route(_trip):
        return _make_route()

    monkeypatch.setattr(
        "app.routers.routes.generate_route", _fake_generate_route
    )
    return _fake_generate_route


@pytest.fixture
def mock_replace_single_stop(monkeypatch):
    """Replace ``replace_single_stop`` with an async stub returning a new Stop."""

    async def _fake_replace(_route, stop_id, _day, _preferences):
        return Stop(
            id=stop_id,
            name="Pantheon",
            type="landmark",
            lat=41.8986,
            lng=12.4769,
            duration_minutes=60,
            notes="Free entry",
            booking_url="",
        )

    monkeypatch.setattr(
        "app.routers.routes.replace_single_stop", _fake_replace
    )
    return _fake_replace


def test_health_endpoint(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "timestamp" in body


def test_create_route_mock(client, mock_generate_route):
    resp = client.post("/api/route", json=VALID_TRIP_PAYLOAD)
    assert resp.status_code == 200, resp.text

    body = resp.json()
    assert body["title"] == "Rome Adventure"
    assert isinstance(body["days"], list)
    assert len(body["days"]) == 2
    assert body["days"][0]["stops"][0]["name"] == "Colosseum"
    assert body["slug"]
    assert isinstance(body["slug"], str)


def test_get_route_by_slug(client, mock_generate_route):
    create_resp = client.post("/api/route", json=VALID_TRIP_PAYLOAD)
    assert create_resp.status_code == 200
    created = create_resp.json()
    slug = created["slug"]

    fetch_resp = client.get(f"/api/route/{slug}")
    assert fetch_resp.status_code == 200

    fetched = fetch_resp.json()
    assert fetched["slug"] == slug
    assert fetched["title"] == created["title"]
    assert fetched["days"] == created["days"]
    assert fetched["total_budget_estimate"] == created["total_budget_estimate"]


def test_get_route_not_found(client):
    resp = client.get("/api/route/invalid123")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Route not found"


def test_replace_stop(client, mock_generate_route, mock_replace_single_stop):
    create_resp = client.post("/api/route", json=VALID_TRIP_PAYLOAD)
    assert create_resp.status_code == 200
    slug = create_resp.json()["slug"]

    replace_resp = client.patch(
        f"/api/route/{slug}/replace",
        json={
            "stop_id": "stop_001",
            "day": 1,
            "preferences": "something quieter",
        },
    )
    assert replace_resp.status_code == 200, replace_resp.text

    body = replace_resp.json()
    day_one = next(d for d in body["days"] if d["day"] == 1)
    replaced = next(s for s in day_one["stops"] if s["id"] == "stop_001")
    assert replaced["name"] == "Pantheon"
    assert replaced["type"] == "landmark"

    fetch_resp = client.get(f"/api/route/{slug}")
    assert fetch_resp.status_code == 200
    persisted_day = next(
        d for d in fetch_resp.json()["days"] if d["day"] == 1
    )
    persisted_stop = next(
        s for s in persisted_day["stops"] if s["id"] == "stop_001"
    )
    assert persisted_stop["name"] == "Pantheon"
