# AI-Voyage

AI-powered travel planner that generates personalized itineraries from a few trip details. The frontend is a React + Vite app, the backend is a FastAPI service that calls OpenAI for itinerary generation, with Mapbox and OpenWeather for maps and forecasts.

## Prerequisites

- Docker and Docker Compose
- Node.js 20 (for local frontend dev outside Docker)
- Python 3.12 (for local backend dev outside Docker)

## Local Setup

```bash
git clone <repo-url> ai-voyage
cd ai-voyage
cp .env.example .env
# Fill in OPENAI_API_KEY, MAPBOX_TOKEN, OPENWEATHER_KEY in .env
docker-compose up --build
```

## Services

| Service      | URL                                                                  |
| ------------ | -------------------------------------------------------------------- |
| Frontend     | [http://localhost:3000](http://localhost:3000)                       |
| Backend API  | [http://localhost:8000](http://localhost:8000)                       |
| Health check | [http://localhost:8000/api/health](http://localhost:8000/api/health) |

## Documentation

- [Architecture](docs/architecture.md) — components, deployment topology, and the end-to-end data flow when a user generates a route.
- [API Reference](docs/api.md) — full reference for all four backend endpoints with request/response schemas, `curl` examples, and error codes.

## Project Structure

```
ai-voyage/
├── backend/              FastAPI service
│   ├── app/
│   │   ├── database/     SQLite init and session helpers
│   │   ├── models/       Pydantic / ORM models
│   │   ├── routers/      API route handlers (routes, health, ...)
│   │   ├── services/     OpenAI, Mapbox, OpenWeather integrations
│   │   └── main.py       FastAPI app entrypoint
│   ├── data/             SQLite database files (mounted volume)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             React + Vite + TypeScript app
│   ├── src/
│   │   ├── components/   Reusable UI components
│   │   ├── pages/        Route-level pages
│   │   ├── routes/       React Router config
│   │   ├── lib/          Client utilities and API helpers
│   │   └── mocks/        Mock API responses for local dev
│   ├── nginx.conf        Nginx config for the production image
│   └── Dockerfile
├── monitoring/           Monitoring/observability assets
├── docker-compose.yml    Multi-service orchestration
├── .env.example          Template for required secrets
└── pyproject.toml        Python tooling config (lint/format)
```
