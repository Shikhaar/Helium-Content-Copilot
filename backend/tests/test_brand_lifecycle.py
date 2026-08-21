from __future__ import annotations

import pytest
import pytest_asyncio
import aiosqlite
from httpx import ASGITransport, AsyncClient

from app.api.routes import get_db_conn
from app.main import app
from app.models.schemas import (
    Brand,
    BrandAudience,
    CreateBrandRequest,
    Product,
    InventoryStatus,
    UserContext,
)
from app.services.auth_service import get_current_user
from app.services.repositories import (
    BrandRepository,
    ProductRepository,
)


@pytest.mark.asyncio
async def test_create_brand_requires_authentication(memory_db):
    async def override_db():
        yield memory_db

    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/brands", json={
            "name": "New Brand",
            "campaign": "Spring 2026",
            "tone": ["Fresh"],
        })
        assert res.status_code == 401

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_brand_success(memory_db, workspace_a_user):
    async def override_db():
        yield memory_db

    app.dependency_overrides[get_current_user] = lambda: workspace_a_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/brands", json={
            "name": "Acme Brand",
            "description": "Acme footwear",
            "campaign": "Fall 2026",
            "tone": ["Bold", "Energetic"],
        })
        assert res.status_code == 201
        data = res.json()
        assert data["id"] == "acme-brand"
        assert data["name"] == "Acme Brand"
        assert data["workspace_id"] == "ws_acme"

        # Verify brand can be fetched
        get_res = await client.get("/api/brands/acme-brand")
        assert get_res.status_code == 200

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_brand_requires_authentication(memory_db):
    async def override_db():
        yield memory_db

    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.delete("/api/brands/snitch")
        assert res.status_code == 401

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_brand_unauthorized_rejected_403(memory_db, workspace_a_user, workspace_b_user):
    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="acme-brand",
        workspace_id="ws_acme",
        name="Acme",
        description="Desc",
        tone=["Bold"],
        audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
        campaign="Summer",
    ))

    async def override_db():
        yield memory_db

    # User B in ws_beta tries to delete Acme brand in ws_acme
    app.dependency_overrides[get_current_user] = lambda: workspace_b_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.delete("/api/brands/acme-brand")
        assert res.status_code == 403

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_cannot_delete_last_brand(memory_db, workspace_a_user):
    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="only-brand",
        workspace_id="ws_acme",
        name="Only Brand",
        description="Desc",
        tone=["Bold"],
        audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
        campaign="Summer",
    ))

    async def override_db():
        yield memory_db

    app.dependency_overrides[get_current_user] = lambda: workspace_a_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.delete("/api/brands/only-brand")
        assert res.status_code == 400
        assert "Cannot delete the last remaining brand" in res.json()["detail"]

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_delete_brand_cascades_and_removes_data(memory_db, workspace_a_user):
    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="brand-1",
        workspace_id="ws_acme",
        name="Brand One",
        description="Desc",
        tone=["Bold"],
        audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
        campaign="Summer",
    ))
    await brand_repo.create(Brand(
        id="brand-2",
        workspace_id="ws_acme",
        name="Brand Two",
        description="Desc",
        tone=["Bold"],
        audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
        campaign="Summer",
    ))

    # Add a product to brand-1
    prod_repo = ProductRepository(memory_db)
    await prod_repo.create(Product(
        id="prod-1",
        brand_id="brand-1",
        name="Product 1",
        category="Shirts",
        price_inr=999,
        description="Desc",
        features=[],
        season="Summer",
        target_audience="Young",
        inventory_status=InventoryStatus.IN_STOCK,
        views=100,
        sales=10,
    ), brand_id="brand-1")

    async def override_db():
        yield memory_db

    app.dependency_overrides[get_current_user] = lambda: workspace_a_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Delete brand-1
        del_res = await client.delete("/api/brands/brand-1")
        assert del_res.status_code == 200

        # Now brand-1 is 404
        get_res = await client.get("/api/brands/brand-1")
        assert get_res.status_code == 404

        # Products of brand-1 are 404
        prod_res = await client.get("/api/brands/brand-1/products")
        assert prod_res.status_code == 404

    app.dependency_overrides.clear()
