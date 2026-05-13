"""Async Google Gemini client setup.

Loads GEMINI_API_KEY from the environment (via python-dotenv) and exposes a
module-level `google-genai` client instance for use across the app. Async
methods are accessed via ``client.aio.*``.
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from google import genai

logger = logging.getLogger(__name__)

load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Model used for the lightweight connectivity check in `ping_gemini`.
PING_MODEL = os.getenv("GEMINI_PING_MODEL", "gemini-2.5-flash")

client: genai.Client = genai.Client(api_key=GEMINI_API_KEY)


async def ping_gemini() -> bool:
    """Send a tiny request to verify the Gemini connection.

    Returns True on a successful round-trip, False otherwise.
    """
    if not GEMINI_API_KEY:
        logger.warning("ping_gemini failed: GEMINI_API_KEY is not set")
        return False

    try:
        response = await client.aio.models.generate_content(
            model=PING_MODEL,
            contents="ping",
            config={"max_output_tokens": 1},
        )
        return response is not None
    except Exception as exc:
        logger.warning("ping_gemini failed: %s", exc)
        return False
