import json

import aiosqlite
from aiosqlite import IntegrityError
from app.database.connection import DATABASE_PATH
from app.models.schemas import RouteResponse
from nanoid import generate


async def _insert(slug: str, data: RouteResponse) -> None:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "INSERT INTO routes (slug, data_json) VALUES (?, ?)",
            (slug, data.model_dump_json()),
        )
        await db.commit()


async def save_route(data: RouteResponse) -> str:
    slug = generate(size=8)
    try:
        await _insert(slug, data)
    except IntegrityError:
        slug = generate(size=8)
        await _insert(slug, data)
    return slug


async def get_route_by_slug(slug: str) -> dict | None:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT data_json, created_at FROM routes WHERE slug = ?",
            (slug,),
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        return None
    data = json.loads(row["data_json"])
    data["created_at"] = row["created_at"]
    return data
