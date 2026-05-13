from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from google.api_core import exceptions as google_exceptions

from app.models.schemas import RouteResponse, TripRequest

VALID_ROME_JSON = """{
  "title": "Rome Adventure",
  "days": [
    {
      "day": 1,
      "date": "2025-07-01",
      "stops": [
        {
          "id": "stop_001",
          "name": "Colosseum",
          "type": "landmark",
          "lat": 41.8902,
          "lng": 12.4922,
          "duration_minutes": 120,
          "notes": "Book skip-the-line tickets",
          "booking_url": "https://colosseum.example.com"
        },
        {
          "id": "stop_002",
          "name": "Roman Forum",
          "type": "landmark",
          "lat": 41.8925,
          "lng": 12.4853,
          "duration_minutes": 90,
          "notes": "Included with Colosseum ticket",
          "booking_url": ""
        }
      ]
    },
    {
      "day": 2,
      "date": "2025-07-02",
      "stops": [
        {
          "id": "stop_003",
          "name": "Vatican Museums",
          "type": "museum",
          "lat": 41.9065,
          "lng": 12.4536,
          "duration_minutes": 180,
          "notes": "Arrive early to avoid queues",
          "booking_url": "https://vatican.example.com"
        }
      ]
    }
  ],
  "total_budget_estimate": 850.0,
  "currency": "USD"
}"""

TRIP_REQUEST = TripRequest(
    destination="Rome",
    start_date="2025-07-01",
    end_date="2025-07-03",
    budget=1000,
    interests=["history", "food"],
)


def _mock_response(text: str) -> MagicMock:
    resp = MagicMock()
    resp.text = text
    return resp


@pytest.fixture()
def _no_sleep(monkeypatch):
    """Eliminate retry delays in tests."""
    import asyncio

    async def _instant(*_a, **_kw):
        pass

    monkeypatch.setattr(asyncio, "sleep", _instant)


@pytest.mark.asyncio
@patch("app.services.route_service.genai")
async def test_generate_route_returns_valid_schema(mock_genai, _no_sleep):
    mock_client = MagicMock()
    mock_genai.Client.return_value = mock_client
    mock_client.models.generate_content.return_value = _mock_response(VALID_ROME_JSON)

    from app.services.route_service import generate_route

    result = await generate_route(TRIP_REQUEST)

    assert isinstance(result, RouteResponse)
    assert result.title == "Rome Adventure"
    assert len(result.days) == 2
    assert result.days[0].stops[0].name == "Colosseum"
    assert result.total_budget_estimate == 850.0


@pytest.mark.asyncio
@patch("app.services.route_service.genai")
async def test_generate_route_invalid_json(mock_genai, _no_sleep):
    mock_client = MagicMock()
    mock_genai.Client.return_value = mock_client
    mock_client.models.generate_content.return_value = _mock_response("not json")

    from app.services.route_service import generate_route

    with pytest.raises(ValueError, match="invalid JSON"):
        await generate_route(TRIP_REQUEST)


@pytest.mark.asyncio
@patch("app.services.route_service.genai")
async def test_generate_route_retry_on_timeout(mock_genai, _no_sleep):
    mock_client = MagicMock()
    mock_genai.Client.return_value = mock_client
    mock_client.models.generate_content.side_effect = [
        google_exceptions.DeadlineExceeded("timeout"),
        _mock_response(VALID_ROME_JSON),
    ]

    from app.services.route_service import generate_route

    result = await generate_route(TRIP_REQUEST)

    assert isinstance(result, RouteResponse)
    assert result.title == "Rome Adventure"
    assert mock_client.models.generate_content.call_count == 2


@pytest.mark.asyncio
@patch("app.services.route_service.genai")
async def test_generate_route_retry_on_service_unavailable(mock_genai, _no_sleep):
    mock_client = MagicMock()
    mock_genai.Client.return_value = mock_client
    mock_client.models.generate_content.side_effect = [
        google_exceptions.ServiceUnavailable("unavailable"),
        _mock_response(VALID_ROME_JSON),
    ]

    from app.services.route_service import generate_route

    result = await generate_route(TRIP_REQUEST)

    assert isinstance(result, RouteResponse)
    assert mock_client.models.generate_content.call_count == 2


@pytest.mark.asyncio
@patch("app.services.route_service.genai")
async def test_generate_route_retry_on_rate_limit(mock_genai, _no_sleep):
    mock_client = MagicMock()
    mock_genai.Client.return_value = mock_client
    mock_client.models.generate_content.side_effect = [
        google_exceptions.ResourceExhausted("rate limited"),
        _mock_response(VALID_ROME_JSON),
    ]

    from app.services.route_service import generate_route

    result = await generate_route(TRIP_REQUEST)

    assert isinstance(result, RouteResponse)
    assert mock_client.models.generate_content.call_count == 2


@pytest.mark.asyncio
@patch("app.services.route_service.genai")
async def test_generate_route_fails_after_max_retries(mock_genai, _no_sleep):
    mock_client = MagicMock()
    mock_genai.Client.return_value = mock_client
    mock_client.models.generate_content.side_effect = google_exceptions.DeadlineExceeded(
        "timeout"
    )

    from app.services.route_service import generate_route

    with pytest.raises(HTTPException) as exc_info:
        await generate_route(TRIP_REQUEST)

    assert exc_info.value.status_code == 503
    assert mock_client.models.generate_content.call_count == 3
