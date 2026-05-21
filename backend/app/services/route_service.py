import asyncio
import json
import logging
import os

from app.metrics import gemini_api_calls_total
from app.models.schemas import RouteResponse, TripRequest
from fastapi import HTTPException
from google import genai
from google.api_core import exceptions as google_exceptions
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import ValidationError

logger = logging.getLogger(__name__)

# The legacy google-api-core exceptions still cover transport-level timeouts;
# google-genai raises its own ServerError (5xx) / ClientError (4xx incl. 429).
_RETRYABLE_LEGACY_EXCEPTIONS = (
    google_exceptions.DeadlineExceeded,
    google_exceptions.ServiceUnavailable,
    google_exceptions.ResourceExhausted,
)
_MAX_ATTEMPTS = 3
_BACKOFF_SECONDS = (1, 2, 4)
_GEMINI_TIMEOUT_MS = 30_000
_GEMINI_MODEL = "gemini-2.5-flash"


def _is_retryable_genai_error(exc: BaseException) -> bool:
    """True for transient google-genai errors (5xx or 429 rate-limit)."""
    if isinstance(exc, genai_errors.ServerError):
        return True
    if isinstance(exc, genai_errors.ClientError):
        return getattr(exc, "code", None) == 429
    return False


SYSTEM_PROMPT = """You are a travel route planner. Return ONLY valid JSON matching this schema exactly — no markdown, no explanation, no extra keys:

{
  "title": str,
  "days": [
    {
      "day": int,
      "date": "YYYY-MM-DD",
      "stops": [
        {
          "id": "stop_XXX",
          "name": str,
          "type": str,
          "lat": float,
          "lng": float,
          "duration_minutes": int,
          "notes": str,
          "booking_url": str
        }
      ]
    }
  ],
  "total_budget_estimate": float,
  "currency": "USD"
}

Rules:
- Each stop must have a unique id in the format "stop_001", "stop_002", etc.
- Use real coordinates for each location.
- "type" should be one of: landmark, museum, food, nature, shopping, entertainment, transport.
- "booking_url" can be empty string if not applicable.
- "total_budget_estimate" should reflect a realistic estimate for the given budget range.
- Generate one Day object per calendar day between start_date and end_date (inclusive).
"""


def extract_json(raw: str) -> str:
    """Strip markdown code fences that Gemini sometimes wraps JSON in."""
    cleaned = raw.strip()
    if cleaned.startswith("```json") or cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if len(lines) >= 2 and lines[-1].strip().startswith("```"):
            lines = lines[1:-1]
        else:
            lines = lines[1:]
        cleaned = "\n".join(lines).strip()
    return cleaned


def _ensure_stop_ids(parsed: dict) -> dict:
    """Auto-generate stop IDs if Gemini forgot them.

    Stops without a non-empty `id` are assigned `stop_{day}_{idx:03d}`,
    where `day` is the day's `day` field (falling back to its position)
    and `idx` is the stop's 1-based position within that day.
    """
    days = parsed.get("days")
    if not isinstance(days, list):
        return parsed

    for day_pos, day in enumerate(days, start=1):
        if not isinstance(day, dict):
            continue
        day_num = day.get("day", day_pos)
        stops = day.get("stops")
        if not isinstance(stops, list):
            continue
        for idx, stop in enumerate(stops, start=1):
            if not isinstance(stop, dict):
                continue
            if not stop.get("id"):
                stop["id"] = f"stop_{day_num}_{idx:03d}"
    return parsed


async def generate_route(request: TripRequest) -> RouteResponse:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    user_prompt = (
        f"Plan a trip to {request.destination} "
        f"from {request.start_date} to {request.end_date}. "
        f"Budget: ${request.budget:.0f}. "
        f"Interests: {', '.join(request.interests)}."
    )

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        response_mime_type="application/json",
        temperature=0.7,
        max_output_tokens=8192,
        thinking_config=types.ThinkingConfig(thinking_budget=0),
        http_options=types.HttpOptions(timeout=_GEMINI_TIMEOUT_MS),
    )

    response = None
    for attempt in range(_MAX_ATTEMPTS):
        try:
            response = client.models.generate_content(
                model=_GEMINI_MODEL,
                contents=user_prompt,
                config=config,
            )
            gemini_api_calls_total.labels(
                status="success", model=_GEMINI_MODEL
            ).inc()
            break
        except _RETRYABLE_LEGACY_EXCEPTIONS as e:
            gemini_api_calls_total.labels(
                status="error", model=_GEMINI_MODEL
            ).inc()
            if attempt == _MAX_ATTEMPTS - 1:
                logger.error(
                    "Gemini API failed after %d attempts: %s", _MAX_ATTEMPTS, e
                )
                raise HTTPException(
                    status_code=503,
                    detail="AI service unavailable, please try again",
                ) from e
            delay = _BACKOFF_SECONDS[attempt]
            logger.warning(
                "Gemini API call failed (attempt %d/%d): %s. Retrying in %ds.",
                attempt + 1,
                _MAX_ATTEMPTS,
                e,
                delay,
            )
            await asyncio.sleep(delay)
        except genai_errors.APIError as e:
            gemini_api_calls_total.labels(
                status="error", model=_GEMINI_MODEL
            ).inc()
            if not _is_retryable_genai_error(e) or attempt == _MAX_ATTEMPTS - 1:
                logger.error(
                    "Gemini API error (code=%s) after attempt %d/%d: %s",
                    getattr(e, "code", "?"),
                    attempt + 1,
                    _MAX_ATTEMPTS,
                    e,
                )
                if getattr(e, "code", None) == 429:
                    raise HTTPException(
                        status_code=429,
                        detail="AI service is rate-limited, please try again in a moment",
                    ) from e
                raise HTTPException(
                    status_code=503,
                    detail="AI service unavailable, please try again",
                ) from e
            delay = _BACKOFF_SECONDS[attempt]
            logger.warning(
                "Gemini API call failed (attempt %d/%d, code=%s): %s. Retrying in %ds.",
                attempt + 1,
                _MAX_ATTEMPTS,
                getattr(e, "code", "?"),
                e,
                delay,
            )
            await asyncio.sleep(delay)

    text = response.text
    if not text:
        raise ValueError("Empty response from Gemini")

    finish_reason = None
    try:
        finish_reason = response.candidates[0].finish_reason
    except (AttributeError, IndexError, TypeError):
        pass
    if finish_reason and str(finish_reason).endswith("MAX_TOKENS"):
        logger.error(
            "Gemini response truncated by MAX_TOKENS (got %d chars). "
            "Increase max_output_tokens.",
            len(text),
        )
        raise HTTPException(
            status_code=502,
            detail="AI response was truncated, please try again",
        )

    try:
        parsed = json.loads(extract_json(text))
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON: {e}") from e

    parsed = _ensure_stop_ids(parsed)

    try:
        return RouteResponse(**parsed)
    except ValidationError as e:
        raise ValueError(f"Gemini response failed schema validation: {e}") from e
