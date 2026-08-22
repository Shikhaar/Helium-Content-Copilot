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
    Confidence,
    InventoryStatus,
    Opportunity,
    Product,
    ScoreBreakdown,
    UserContext,
)
from app.services.auth_service import get_current_user
from app.services.repositories import (
    BrandRepository,
    OpportunityRepository,
    ProductRepository,
)


@pytest.mark.asyncio
async def test_unauthenticated_request_returns_401(memory_db):
    async def override_db():
        yield memory_db

    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/brands")
        assert res.status_code == 401

        res = await client.get("/api/brands/snitch")
        assert res.status_code == 401

        res = await client.get("/api/brands/snitch/products")
        assert res.status_code == 401

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_authorized_user_can_access_own_workspace_brand(memory_db, default_user):
    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="snitch",
        workspace_id="default_workspace",
        name="SNITCH",
        description="Men's fashion",
        tone=["Bold"],
        audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
        campaign="Summer 2026",
    ))

    async def override_db():
        yield memory_db

    app.dependency_overrides[get_current_user] = lambda: default_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/brands/snitch")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "snitch"
        assert data["name"] == "SNITCH"

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_unauthorized_user_cross_workspace_access_rejected_403(memory_db, workspace_b_user):
    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="acme-brand",
        workspace_id="ws_acme",
        name="Acme Brand",
        description="Acme Corp",
        tone=["Professional"],
        audience=BrandAudience(age_range="25-45", location="US", interests=[], shopping_behavior=[]),
        campaign="Q3 Launch",
    ))

    async def override_db():
        yield memory_db

    app.dependency_overrides[get_current_user] = lambda: workspace_b_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/brands/acme-brand")
        assert res.status_code == 403
        assert "Access denied" in res.json()["detail"]

        res_prod = await client.get("/api/brands/acme-brand/products")
        assert res_prod.status_code == 403

        res_opp = await client.get("/api/brands/acme-brand/opportunities")
        assert res_opp.status_code == 403

        res_cal = await client.get("/api/brands/acme-brand/calendar")
        assert res_cal.status_code == 403

        res_perf = await client.get("/api/brands/acme-brand/performance")
        assert res_perf.status_code == 403

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_single_resource_cross_brand_isolation(memory_db, workspace_b_user):
    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="acme-brand",
        workspace_id="ws_acme",
        name="Acme Brand",
        description="Acme Corp",
        tone=["Professional"],
        audience=BrandAudience(age_range="25-45", location="US", interests=[], shopping_behavior=[]),
        campaign="Q3 Launch",
    ))

    prod_repo = ProductRepository(memory_db)
    await prod_repo.create(Product(
        id="prod_acme_1",
        brand_id="acme-brand",
        name="Acme Runner",
        category="Shoes",
        price_inr=2499,
        description="Running shoes",
        features=["Lightweight"],
        season="All Season",
        target_audience="Athletes",
        inventory_status=InventoryStatus.IN_STOCK,
        views=100,
        sales=10,
    ), brand_id="acme-brand")

    opp_repo = OpportunityRepository(memory_db)
    await opp_repo.save_all([Opportunity(
        id="opp_secret_1",
        brand_id="acme-brand",
        title="Confidential Strategy",
        content_angle="Top Secret Angle",
        audience="Enterprise",
        objective="Conversion",
        platform="LinkedIn",
        format="Static Post",
        suggested_product_id="prod_acme_1",
        suggested_product_name="Acme Runner",
        why="Strategy reason",
        historical_signal="Signal 1",
        product_signal="Signal 2",
        audience_signal="Signal 3",
        seasonal_signal="Signal 4",
        business_signal="Signal 5",
        score=95,
        score_breakdown=ScoreBreakdown(historical=25, product=25, audience=20, seasonal=15, objective=10),
        confidence=Confidence.HIGH,
        confidence_reason="High data",
        created_at="2026-08-21T00:00:00Z",
        is_demo=False,
    )], brand_id="acme-brand")

    async def override_db():
        yield memory_db

    app.dependency_overrides[get_current_user] = lambda: workspace_b_user
    app.dependency_overrides[get_db_conn] = override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/opportunities/opp_secret_1")
        assert res.status_code == 403

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_approve_draft_flow(memory_db, default_user, workspace_b_user):
    from app.models.schemas import CarouselSlide, ContentDraft, ContentStatus
    from app.services.repositories import ContentRepository

    brand_repo = BrandRepository(memory_db)
    await brand_repo.create(Brand(
        id="snitch",
        workspace_id="default_workspace",
        name="SNITCH",
        description="Men's fashion",
        tone=["Bold"],
        audience=BrandAudience(age_range="18-30", location="India", interests=[], shopping_behavior=[]),
        campaign="Summer 2026",
    ))
    prod_repo = ProductRepository(memory_db)
    await prod_repo.create(Product(
        id="prod_snitch_1",
        brand_id="snitch",
        name="Snitch Shirt",
        category="Shirts",
        price_inr=1999,
        description="Linen shirt",
        features=["Linen"],
        season="Summer",
        target_audience="Men",
        inventory_status=InventoryStatus.IN_STOCK,
        views=100,
        sales=10,
    ), brand_id="snitch")

    opp_repo = OpportunityRepository(memory_db)
    await opp_repo.save_all([Opportunity(
        id="opp_1",
        brand_id="snitch",
        title="Summer Collection Launch",
        content_angle="Linen comfort",
        audience="Men 18-30",
        objective="Sales",
        platform="Instagram",
        format="Carousel",
        suggested_product_id="prod_snitch_1",
        suggested_product_name="Snitch Shirt",
        why="High summer demand",
        historical_signal="Strong engagement",
        product_signal="High stock",
        audience_signal="Growing segment",
        seasonal_signal="Summer wave",
        business_signal="High margin",
        score=90,
        score_breakdown=ScoreBreakdown(historical=20, product=20, audience=20, seasonal=15, objective=15),
        confidence=Confidence.HIGH,
        confidence_reason="Rich data",
        created_at="2026-08-21T00:00:00Z",
        is_demo=False,
    )], brand_id="snitch")

    content_repo = ContentRepository(memory_db)
    await content_repo.create(ContentDraft(
        id="draft_test_approve_1",
        brand_id="snitch",
        opportunity_id="opp_1",
        platform="Instagram",
        format="Carousel",
        audience="Gen Z",
        objective="Engagement",
        slides=[CarouselSlide(slide_number=1, headline="Summer Drop", body="Fresh styles", visual_cue="Bold imagery")],
        caption="Check out our summer drop",
        cta="Shop now",
        hashtags=["#summer", "#style"],
        status=ContentStatus.DRAFT,
        scheduled_date=None,
        scheduled_time=None,
        created_at="2026-08-21T00:00:00Z",
        updated_at="2026-08-21T00:00:00Z",
        is_demo=False,
    ))

    async def override_db():
        yield memory_db

    # 1. Unauthenticated -> 401
    app.dependency_overrides[get_db_conn] = override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/content/draft_test_approve_1/approve")
        assert res.status_code == 401

    # 2. Unauthorized user in ws_beta -> 403
    app.dependency_overrides[get_current_user] = lambda: workspace_b_user
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/content/draft_test_approve_1/approve")
        assert res.status_code == 403

    # 3. Authorized user in default_workspace -> 200
    app.dependency_overrides[get_current_user] = lambda: default_user
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.post("/api/content/draft_test_approve_1/approve")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == "draft_test_approve_1"
        assert data["status"] == "approved"

    app.dependency_overrides.clear()

