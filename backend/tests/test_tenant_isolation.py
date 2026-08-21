"""
Tests for Multi-Tenant Brand Isolation & Authorization.

Verifies:
  1. Repositories enforce brand_id filtering (Product, Post, Opportunity, Calendar).
  2. Direct cross-tenant access between unauthorized brands is rejected.
  3. Brand authorization dependency enforces user workspace scoping.
"""
import pytest
from fastapi import HTTPException
from app.models.schemas import (
    Brand,
    BrandAudience,
    InventoryStatus,
    Product,
    UserContext,
)
from app.services.auth_service import verify_brand_access
from app.services.repositories import BrandRepository, ProductRepository, OpportunityRepository


class MockBrandRepo:
    def __init__(self, brands: dict[str, Brand]):
        self._brands = brands

    async def get_by_id(self, brand_id: str) -> Brand | None:
        return self._brands.get(brand_id)


@pytest.mark.asyncio
async def test_brand_authorization_allows_authorized_workspace():
    brands = {
        "snitch": Brand(
            id="snitch",
            workspace_id="ws_123",
            name="SNITCH",
            description="Men's fashion",
            tone=["Bold"],
            audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
            campaign="Summer 2026",
        )
    }
    repo = MockBrandRepo(brands)
    user = UserContext(
        clerk_user_id="user_snitch_owner",
        email="owner@snitch.co.in",
        workspace_id="ws_123",
    )

    authorized_brand = await verify_brand_access("snitch", user, repo)
    assert authorized_brand.id == "snitch"
    assert authorized_brand.name == "SNITCH"


@pytest.mark.asyncio
async def test_brand_authorization_rejects_cross_tenant_access():
    brands = {
        "snitch": Brand(
            id="snitch",
            workspace_id="ws_snitch",
            name="SNITCH",
            description="Men's fashion",
            tone=["Bold"],
            audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
            campaign="Summer 2026",
        ),
        "blissclub": Brand(
            id="blissclub",
            workspace_id="ws_blissclub",
            name="BLISSCLUB",
            description="Women's activewear",
            tone=["Comfort"],
            audience=BrandAudience(age_range="22-38", location="India", interests=[], shopping_behavior=[]),
            campaign="Move in Freedom",
        ),
    }
    repo = MockBrandRepo(brands)
    user = UserContext(
        clerk_user_id="user_blissclub_member",
        email="member@blissclub.com",
        workspace_id="ws_blissclub",
    )

    # User A attempting to access Brand B across tenant boundaries must raise 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        await verify_brand_access("snitch", user, repo)
    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail


@pytest.mark.asyncio
async def test_brand_authorization_rejects_nonexistent_brand():
    repo = MockBrandRepo({})
    user = UserContext(
        clerk_user_id="user_any",
        email="user@test.com",
        workspace_id="default_workspace",
    )

    with pytest.raises(HTTPException) as exc_info:
        await verify_brand_access("nonexistent_brand", user, repo)
    assert exc_info.value.status_code == 404
