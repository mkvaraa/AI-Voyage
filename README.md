# AI-Voyage

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Live demo:** [gleaming-endurance-production-07af.up.railway.app](https://gleaming-endurance-production-07af.up.railway.app)

AI-powered travel planner that generates personalized itineraries from a few trip details. The frontend is a React + Vite app, the backend is a FastAPI service that calls Google Gemini for itinerary generation, with Mapbox and OpenWeather for maps and forecasts.

## Screenshots

| Landing page | Map view with stops and Generated itinerary|
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Map view and Generated itinerary](docs/screenshots/map.png) |



## Prerequisites

- Docker and Docker Compose
- Node.js 20 (for local frontend dev outside Docker)
- Python 3.12 (for local backend dev outside Docker)

## Local Setup

```bash
git clone <repo-url> ai-voyage
cd ai-voyage
cp .env.example .env
# Fill in GEMINI_API_KEY, MAPBOX_TOKEN, OPENWEATHER_KEY in .env
docker-compose up --build
```

## Services

| Service      | URL                                                                  |
| ------------ | -------------------------------------------------------------------- |
| Frontend     | [http://localhost:5173](http://localhost:5173)                       |
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
│   │   ├── services/     Gemini, Mapbox, OpenWeather integrations
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
├── monitoring/           Monitoring/observability assets (Prometheus, Grafana, Alloy)
├── docker-compose.yml    Multi-service orchestration
├── .env.example          Template for required secrets
└── pyproject.toml        Python tooling config (lint/format)
```
