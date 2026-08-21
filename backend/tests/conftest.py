"""
Shared pytest fixtures and test configuration for BrandBrew backend tests.
"""
from __future__ import annotations

import os
import pytest
import pytest_asyncio
import aiosqlite
from httpx import ASGITransport, AsyncClient

# Ensure testing mode is active for pytest session
from app.core.config import settings
settings.testing = True

from app.core.database import CREATE_TABLES_SQL
from app.main import app
from app.models.schemas import UserContext
from app.services.auth_service import get_current_user


@pytest_asyncio.fixture
async def memory_db():
    """In-memory SQLite database initialized with the full multi-tenant schema."""
    db = await aiosqlite.connect(":memory:")
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA foreign_keys = ON;")
    await db.executescript(CREATE_TABLES_SQL)
    yield db
    await db.close()


@pytest.fixture
def default_user():
    """Authenticated user in default_workspace."""
    return UserContext(
        clerk_user_id="user_snitch_owner",
        email="owner@snitch.co.in",
        name="Snitch Owner",
        role="editor",
        workspace_id="default_workspace",
    )


@pytest.fixture
def workspace_a_user():
    """Authenticated user in workspace A."""
    return UserContext(
        clerk_user_id="user_ws_a",
        email="user_a@acme.com",
        name="Acme User",
        role="editor",
        workspace_id="ws_acme",
    )


@pytest.fixture
def workspace_b_user():
    """Authenticated user in workspace B (unauthorized for workspace A brands)."""
    return UserContext(
        clerk_user_id="user_ws_b",
        email="user_b@beta.com",
        name="Beta User",
        role="editor",
        workspace_id="ws_beta",
    )

