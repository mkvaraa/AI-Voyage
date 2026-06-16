# API Reference

Base URL (production): `https://ai-voyage-production.up.railway.app`
Base URL (local): `http://localhost:8000`

All endpoints return JSON. All endpoints under `/api/route` go through
Pydantic validation; failures yield a `422` with a friendly error list (see
[Error Codes](#error-codes)).

## Endpoints overview

| # | Method | Path | Purpose |
|---|---|---|---|
| 1 | `GET` | `/api/health` | Liveness probe. |
| 2 | `POST` | `/api/route` | Generate a new itinerary via Gemini and persist it. |
| 3 | `GET` | `/api/route/{slug}` | Fetch a previously generated itinerary by slug. |
| 4 | `PATCH` | `/api/route/{slug}/replace` | Replace a single stop within an existing itinerary. |

---

## 1. `GET /api/health`

Cheap health check. Used by Railway, monitoring, and CI smoke tests.

| | |
|---|---|
| **Auth** | None |
| **Request body** | — |
| **Response** | `200 OK` |

**Response schema**

```json
{
  "status": "ok",
  "timestamp": "2026-06-18T18:34:21.123456+00:00"
}
```

**Example**

```bash
curl -s http://localhost:8000/api/health
```

---

## 2. `POST /api/route`

Generates an itinerary for the given trip parameters by calling Gemini, then
saves the result and returns it with a freshly minted `slug`.

| | |
|---|---|
| **Auth** | None |
| **Request body** | `TripRequest` (JSON) |
| **Response** | `200 OK` with `RouteResponse` |

**Request body — `TripRequest`**

| Field | Type | Constraints |
|---|---|---|
| `destination` | string | min length 2, must be non-empty |
| `start_date` | date (`YYYY-MM-DD`) | required |
| `end_date` | date (`YYYY-MM-DD`) | must be **strictly after** `start_date` |
| `budget` | number | `50 ≤ budget ≤ 50000` |
| `interests` | string[] | at least one item |

**Response schema — `RouteResponse`**

```json
{
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
        }
      ]
    }
  ],
  "total_budget_estimate": 850.0,
  "currency": "USD",
  "slug": "aB3kP9xQ",
  "created_at": "2026-06-18 18:34:21"
}
```

`type` is one of: `landmark`, `museum`, `food`, `nature`, `shopping`,
`entertainment`, `transport`. `booking_url` may be an empty string.

**Example**

```bash
curl -s -X POST http://localhost:8000/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Rome",
    "start_date": "2025-07-01",
    "end_date": "2025-07-03",
    "budget": 1000,
    "interests": ["history", "food"]
  }'
```

**Possible failures:** `422` (bad input), `429` (Gemini rate limit), `503`
(Gemini unavailable after retries), `502` (Gemini truncated the response).

---

## 3. `GET /api/route/{slug}`

Returns a previously saved itinerary. The slug is the value returned by
`POST /api/route`. Used to render shareable URLs (`/route/:slug` on the
frontend).

| | |
|---|---|
| **Auth** | None |
| **Path param** | `slug` (string, 8–12 chars) |
| **Response** | `200 OK` with `RouteResponse`, or `404` if not found |

**Example**

```bash
curl -s http://localhost:8000/api/route/aB3kP9xQ
```

**Possible failures:** `404 Route not found`.

---

## 4. `PATCH /api/route/{slug}/replace`

Asks Gemini for a single replacement stop and swaps it into the saved route
in place. Useful for "I don't like this museum, give me something else".

| | |
|---|---|
| **Auth** | None |
| **Path param** | `slug` (string) |
| **Request body** | `ReplaceStopRequest` (JSON) |
| **Response** | `200 OK` with the updated `RouteResponse` |

**Request body — `ReplaceStopRequest`**

| Field | Type | Constraints |
|---|---|---|
| `stop_id` | string | non-empty; must exist in the target day |
| `day` | integer | `≥ 1`; must match an existing day |
| `preferences` | string \| null | optional free-text hint passed to Gemini |

**Example**

```bash
curl -s -X PATCH http://localhost:8000/api/route/aB3kP9xQ/replace \
  -H "Content-Type: application/json" \
  -d '{
    "stop_id": "stop_001",
    "day": 1,
    "preferences": "something quieter and free"
  }'
```

The response is the **full** updated `RouteResponse` (same shape as
`POST /api/route`), with the replaced stop in place. The new stop keeps the
original `stop_id` so frontend references stay stable.

**Possible failures:** `404` (slug, day, or stop not found), `422` (bad
body), `429` / `503` / `502` (Gemini issues, see below).

---

## Error codes

The backend uses standard HTTP status codes. The body shape depends on which
handler raised the error.

| Status | When | Body shape |
|---|---|---|
| `404 Not Found` | Slug, day, or stop_id does not exist. | `{"detail": "Route not found"}` (FastAPI default) |
| `422 Unprocessable Entity` | Pydantic validation failed (missing field, bad type, end date not after start, budget out of range, etc). | `{"error": "Invalid request", "details": ["Please enter a destination", "End date must be after start date"]}` (custom; see `app/errors.py`) |
| `429 Too Many Requests` | Gemini returned a 429 rate-limit error and retries were exhausted. | `{"detail": "AI service is rate-limited, please try again in a moment"}` |
| `502 Bad Gateway` | Gemini's response was cut off by `MAX_TOKENS`. | `{"detail": "AI response was truncated, please try again"}` |
| `503 Service Unavailable` | Gemini timed out or returned a 5xx after 3 retries with exponential backoff (1 s, 2 s, 4 s). | `{"detail": "AI service unavailable, please try again"}` |

### Validation error example

`POST /api/route` with `end_date` before `start_date`:

```json
{
  "error": "Invalid request",
  "details": [
    "End date must be after start date"
  ]
}
```

### 503 example

When Gemini is unreachable:

```json
{
  "detail": "AI service unavailable, please try again"
}
```

---

## Other endpoints

- `GET /metrics` — Prometheus-formatted metrics, exposed by
  `prometheus-fastapi-instrumentator`. Scraped by Grafana Alloy in production
  and by the local Prometheus container in `docker-compose.yml`. Not intended
  for browser use.
