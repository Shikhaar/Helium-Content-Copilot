"""
Unit and integration tests for Clerk authentication and user synchronization.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
import aiosqlite
from fastapi import HTTPException
from app.core.database import CREATE_TABLES_SQL
from app.models.schemas import UserContext
from app.services.auth_service import verify_clerk_token
from app.services.repositories import UserRepository


@pytest_asyncio.fixture
async def memory_db():
    db = await aiosqlite.connect(":memory:")
    db.row_factory = aiosqlite.Row
    await db.executescript(CREATE_TABLES_SQL)
    yield db
    await db.close()


@pytest.mark.asyncio
async def test_verify_valid_test_token():
    ctx = await verify_clerk_token("Bearer valid-test-token")
    assert ctx.clerk_user_id == "user_test_123"
    assert ctx.email == "tester@helium.internal"
    assert ctx.role == "editor"


@pytest.mark.asyncio
async def test_verify_missing_token_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        await verify_clerk_token("")
    assert exc_info.value.status_code == 401
    assert "Missing authentication" in exc_info.value.detail


@pytest.mark.asyncio
async def test_verify_invalid_token_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        await verify_clerk_token("invalid-garbage-token")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_user_repository_sync_and_get(memory_db):
    repo = UserRepository(memory_db)
    ctx = UserContext(
        clerk_user_id="user_clerk_abc123",
        name="Shikhar Srivastava",
        email="shikhar@snitch.co.in",
        avatar_url="https://example.com/avatar.png",
        role="editor",
        workspace_id="ws_snitch_001",
    )

    user = await repo.sync_user(ctx)
    assert user.clerk_user_id == "user_clerk_abc123"
    assert user.name == "Shikhar Srivastava"
    assert user.email == "shikhar@snitch.co.in"

    # Fetch by ID
    fetched = await repo.get_by_clerk_id("user_clerk_abc123")
    assert fetched is not None
    assert fetched.id == user.id
    assert fetched.name == "Shikhar Srivastava"

    # Update on second sync
    ctx_updated = UserContext(
        clerk_user_id="user_clerk_abc123",
        name="Shikhar S.",
        email="shikhar@snitch.co.in",
        avatar_url="https://example.com/new-avatar.png",
    )
    user_updated = await repo.sync_user(ctx_updated)
    assert user_updated.name == "Shikhar S."
    assert user_updated.avatar_url == "https://example.com/new-avatar.png"
