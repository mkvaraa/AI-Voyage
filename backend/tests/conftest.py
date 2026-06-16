"""Shared pytest fixtures for backend tests.

Provides a TestClient bound to a per-test temporary SQLite database so that
API tests don't touch the real ``./data/routes.db`` file.
"""

from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def test_db_path(tmp_path, monkeypatch):
    """Point all DB-using modules at a fresh SQLite file under tmp_path."""
    db_file = tmp_path / "test_routes.db"
    db_path = str(db_file)

    from app.database import connection as connection_mod
    from app.database import crud as crud_mod
    from app.database import init_db as init_db_mod

    monkeypatch.setattr(connection_mod, "DATABASE_PATH", db_path)
    monkeypatch.setattr(crud_mod, "DATABASE_PATH", db_path)
    monkeypatch.setattr(init_db_mod, "DATABASE_PATH", db_path)

    return db_path


@pytest.fixture
def client(test_db_path):
    """FastAPI TestClient with the DB redirected at a temp file.

    Using ``with TestClient(app)`` triggers the app's startup event, which
    calls ``init_db()`` and creates the ``routes`` table in the temp DB.
    """
    from app.main import app

    with TestClient(app) as c:
        yield c
