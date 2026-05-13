import asyncio
import json
import traceback
from datetime import date

from dotenv import load_dotenv

load_dotenv("../.env")

from app.models.schemas import TripRequest
from app.services.route_service import generate_route


async def main():
    req = TripRequest(
        destination="Tbilisi",
        start_date=date(2026, 7, 1),
        end_date=date(2026, 7, 3),
        budget=1500,
        interests=["food", "history"],
    )
    print("Calling Gemini...")
    result = await generate_route(req)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        traceback.print_exc()
