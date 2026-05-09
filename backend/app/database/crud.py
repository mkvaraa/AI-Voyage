import json

import aiosqlite
from app.database.connection import DATABASE_PATH
from app.models.schemas import RouteResponse


async def save_route(slug: str, data: RouteResponse) -> None:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute(
            "INSERT INTO routes (slug, data_json) VALUES (?, ?)",
            (slug, data.model_dump_json()),
        )
        await db.commit()


async def get_route_by_slug(slug: str) -> dict | None:
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT data_json FROM routes WHERE slug = ?",
            (slug,),
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        return None
    return json.loads(row["data_json"])
