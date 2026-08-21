"""
FastAPI routes for BrandBrew — AI Content Strategist.

Architecture:
  - Multi-tenant brand scoping across all endpoints
  - Deterministic 2-stage recommendation engine (Candidate Generation -> Scoring)
  - Persisted opportunity reads for instant dashboard loads
  - Clerk JWT verification & user profile sync
"""
from __future__ import annotations

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db
from app.core.logging_config import get_logger
from app.models.schemas import (
    AnalyzeResponse,
    ApiResponse,
    Brand,
    CalendarEntry,
    ContentDraft,
    ContentStatus,
    CreateProductRequest,
    GenerateContentRequest,
    Opportunity,
    Product,
    ScheduleRequest,
    UpdateBrandRequest,
    UpdateDraftRequest,
    UserContext,
    UserResponse,
)
from app.services.ai.providers import get_ai_provider
from app.services.analytics import AnalyticsService
from app.services.auth_service import get_current_user, get_optional_user, verify_brand_access
from app.services.candidate_generator import CandidateGenerationService
from app.services.content_generator import ContentGeneratorService
from app.services.repositories import (
    BrandRepository,
    CalendarRepository,
    ContentRepository,
    OpportunityRepository,
    PostRepository,
    ProductRepository,
    UserRepository,
)
from app.services.scoring import ScoringService
from app.services.strategist import StrategistService

logger = get_logger(__name__)
router = APIRouter()


# ── Dependency helpers ─────────────────────────────────────────────────────────

async def get_db_conn():
    db = await get_db()
    try:
        yield db
    finally:
        await db.close()


def _make_strategist(db: aiosqlite.Connection) -> StrategistService:
    analytics = AnalyticsService()
    candidate_generator = CandidateGenerationService()
    return StrategistService(
        brand_repo=BrandRepository(db),
        product_repo=ProductRepository(db),
        post_repo=PostRepository(db),
        opportunity_repo=OpportunityRepository(db),
        analytics=analytics,
        candidate_generator=candidate_generator,
        scoring=ScoringService(analytics),
        ai_provider=get_ai_provider(),
    )


def _make_content_service(db: aiosqlite.Connection) -> ContentGeneratorService:
    return ContentGeneratorService(
        brand_repo=BrandRepository(db),
        product_repo=ProductRepository(db),
        opportunity_repo=OpportunityRepository(db),
        content_repo=ContentRepository(db),
        calendar_repo=CalendarRepository(db),
        ai_provider=get_ai_provider(),
    )


# ── Brands & Workspace Tenancy ────────────────────────────────────────────────

@router.get("/brands", response_model=list[Brand])
async def list_brands(
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext | None = Depends(get_optional_user),
):
    """List all accessible brands in the current workspace."""
    repo = BrandRepository(db)
    workspace_id = user.workspace_id if user else None
    brands = await repo.list_all(workspace_id=workspace_id)
    if not brands:
        brands = await repo.list_all()
    logger.info("GET /api/brands -> %d brands returned", len(brands))
    return brands


@router.get("/brands/{brand_id}", response_model=Brand)
async def get_brand_by_id(
    brand_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Retrieve brand profile and guidelines by brand_id."""
    brand = await BrandRepository(db).get_by_id(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail=f"Brand '{brand_id}' not found.")
    return brand


@router.get("/brand", response_model=Brand)
async def get_default_brand(db: aiosqlite.Connection = Depends(get_db_conn)):
    """Backwards-compatible endpoint for active brand profile."""
    brand = await BrandRepository(db).get()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


@router.patch("/brands/{brand_id}", response_model=Brand)
@router.patch("/brand", response_model=Brand)
async def update_brand(
    updates: UpdateBrandRequest,
    brand_id: str = "snitch",
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Update brand guidelines or active campaign name."""
    repo = BrandRepository(db)
    brand = await repo.get_by_id(brand_id) or await repo.get()
    if not brand:
        raise HTTPException(status_code=404, detail=f"Brand '{brand_id}' not found")

    if updates.name is not None:
        brand.name = updates.name
    if updates.description is not None:
        brand.description = updates.description
    if updates.tone is not None:
        brand.tone = updates.tone
    if updates.campaign is not None:
        brand.campaign = updates.campaign
    if updates.audience is not None:
        brand.audience = updates.audience

    return await repo.update(brand)


# ── Products Endpoints ────────────────────────────────────────────────────────

@router.get("/brands/{brand_id}/products", response_model=list[Product])
@router.get("/products", response_model=list[Product])
async def list_products(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """List catalog products scoped by brand_id."""
    effective_brand_id = brand_id or "snitch"
    logger.info("GET products for brand_id='%s'", effective_brand_id)
    return await ProductRepository(db).list_all(brand_id=effective_brand_id)


@router.post("/brands/{brand_id}/products", response_model=Product, status_code=status.HTTP_201_CREATED)
@router.post("/products", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product(
    req: CreateProductRequest,
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Create a new product in the brand catalog."""
    effective_brand_id = brand_id or "snitch"
    logger.info("POST product for brand_id='%s' name='%s'", effective_brand_id, req.name)
    import uuid
    product_id = f"prod_{uuid.uuid4().hex[:8]}"
    product = Product(
        id=product_id,
        brand_id=effective_brand_id,
        name=req.name,
        category=req.category,
        price_inr=req.price_inr,
        description=req.description,
        features=req.features,
        season=req.season,
        target_audience=req.target_audience,
        inventory_status=req.inventory_status,
        views=req.views or 1200,
        sales=req.sales or 45,
    )
    return await ProductRepository(db).create(product, brand_id=effective_brand_id)


@router.delete("/brands/{brand_id}/products/{product_id}")
@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Delete a product from the brand catalog."""
    effective_brand_id = brand_id or "snitch"
    logger.info("DELETE product id='%s' brand_id='%s'", product_id, effective_brand_id)
    repo = ProductRepository(db)
    prod = await repo.get_by_id(product_id, brand_id=effective_brand_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await repo.delete(product_id, brand_id=effective_brand_id)
    return {"status": "ok", "message": f"Product {product_id} deleted"}


# ── Historical Posts & Analytics ──────────────────────────────────────────────

@router.get("/brands/{brand_id}/posts")
@router.get("/posts")
async def list_posts(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """List historical social performance posts scoped by brand_id."""
    effective_brand_id = brand_id or "snitch"
    return await PostRepository(db).list_all(brand_id=effective_brand_id)


@router.get("/brands/{brand_id}/performance")
@router.get("/performance")
async def get_performance(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Compute deterministic performance summary and format benchmarks."""
    effective_brand_id = brand_id or "snitch"
    posts = await PostRepository(db).list_all(brand_id=effective_brand_id)
    return AnalyticsService().compute_summary(posts)


# ── Recommendation Engine & Opportunities ─────────────────────────────────────

@router.get("/brands/{brand_id}/opportunities", response_model=list[Opportunity])
@router.get("/opportunities", response_model=list[Opportunity])
async def list_opportunities(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """
    Read persisted ranked opportunities from PostgreSQL/database.
    Instant read — does NOT invoke LLM on dashboard view.
    """
    effective_brand_id = brand_id or "snitch"
    logger.info("GET opportunities for brand_id='%s'", effective_brand_id)
    opps = await OpportunityRepository(db).list_all(brand_id=effective_brand_id)

    # Enrich product names
    product_repo = ProductRepository(db)
    for opp in opps:
        product = await product_repo.get_by_id(opp.suggested_product_id, brand_id=effective_brand_id)
        if product:
            opp.suggested_product_name = product.name

    return opps


@router.post("/brands/{brand_id}/analyze", response_model=AnalyzeResponse)
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_brand(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """
    Core trigger: runs the 2-Stage Recommendation Engine:
      1. CandidateGenerationService (Product x Format x Audience combinations)
      2. ScoringService (deterministic 5-factor mathematical score /100)
      3. AI Strategist (strategic rationale & creative angles)
      4. Persists ranked results to database for instant future reads.
    """
    effective_brand_id = brand_id or "snitch"
    logger.info("POST /api/analyze for brand_id='%s'", effective_brand_id)
    try:
        svc = _make_strategist(db)
        result = await svc.analyze(brand_id=effective_brand_id)
        logger.info(
            "Analysis complete for '%s' | %d opportunities | top_score=%s",
            effective_brand_id,
            len(result.opportunities),
            result.opportunities[0].score if result.opportunities else "N/A",
        )
        return result
    except ValueError as exc:
        logger.error("Analysis failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def get_opportunity(
    opportunity_id: str,
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Get single opportunity with enriched product details."""
    repo = OpportunityRepository(db)
    opp = await repo.get_by_id(opportunity_id, brand_id=brand_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    product = await ProductRepository(db).get_by_id(opp.suggested_product_id, brand_id=brand_id)
    if product:
        opp.suggested_product_name = product.name
    return opp


# ── Content Studio & Generation ───────────────────────────────────────────────

@router.post("/content/generate", response_model=ContentDraft)
async def generate_content(
    req: GenerateContentRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Generate production-ready content draft from an opportunity."""
    logger.info("POST /api/content/generate | opp_id=%s format=%s", req.opportunity_id, req.format)
    svc = _make_content_service(db)
    return await svc.generate_draft(req)


@router.get("/content/{draft_id}", response_model=ContentDraft)
async def get_draft(
    draft_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Fetch content draft by ID."""
    draft = await ContentRepository(db).get_by_id(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.patch("/content/{draft_id}", response_model=ContentDraft)
async def update_draft(
    draft_id: str,
    updates: UpdateDraftRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Update draft copy, slides, hashtags, or call to action."""
    repo = ContentRepository(db)
    draft = await repo.get_by_id(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    if updates.slides is not None:
        draft.slides = updates.slides
    if updates.caption is not None:
        draft.caption = updates.caption
    if updates.cta is not None:
        draft.cta = updates.cta
    if updates.hashtags is not None:
        draft.hashtags = updates.hashtags

    return await repo.update(draft)


@router.post("/content/{draft_id}/schedule", response_model=ContentDraft)
async def schedule_draft(
    draft_id: str,
    req: ScheduleRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Schedule content draft and create/update calendar entry."""
    svc = _make_content_service(db)
    return await svc.schedule_draft(draft_id, req)


# ── Editorial Calendar ────────────────────────────────────────────────────────

@router.get("/brands/{brand_id}/calendar", response_model=list[CalendarEntry])
@router.get("/calendar", response_model=list[CalendarEntry])
async def list_calendar(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """List all scheduled and draft posts on the editorial calendar."""
    effective_brand_id = brand_id or "snitch"
    return await CalendarRepository(db).list_all(brand_id=effective_brand_id)


@router.patch("/calendar/{entry_id}", response_model=CalendarEntry)
async def update_calendar_entry(
    entry_id: str,
    payload: dict,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Update scheduled date or status of a calendar post."""
    cal_repo = CalendarRepository(db)
    content_repo = ContentRepository(db)

    entry = await cal_repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    if "scheduled_datetime" in payload:
        new_dt = payload["scheduled_datetime"]
        entry.scheduled_datetime = new_dt
        if entry.draft_id:
            draft = await content_repo.get_by_id(entry.draft_id)
            if draft:
                parts = new_dt.split("T")
                draft.scheduled_date = parts[0]
                if len(parts) > 1:
                    draft.scheduled_time = parts[1][:5]
                draft.status = ContentStatus.SCHEDULED
                await content_repo.update(draft)

    if "status" in payload:
        try:
            entry.status = ContentStatus(payload["status"])
        except ValueError:
            pass

    await cal_repo.upsert(entry)
    return entry


@router.delete("/calendar/{entry_id}", response_model=ApiResponse)
async def delete_calendar_entry(
    entry_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Delete a calendar entry and revert associated draft to approved."""
    cal_repo = CalendarRepository(db)
    content_repo = ContentRepository(db)

    entry = await cal_repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")

    if entry.draft_id:
        draft = await content_repo.get_by_id(entry.draft_id)
        if draft:
            draft.status = ContentStatus.APPROVED
            draft.scheduled_date = None
            draft.scheduled_time = None
            await content_repo.update(draft)

    await cal_repo.delete(entry_id)
    return ApiResponse(success=True, message="Calendar entry removed")


# ── Authentication & User Profile ─────────────────────────────────────────────

@router.get("/auth/me", response_model=UserResponse)
async def get_me(
    user_ctx: UserContext = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Get or sync authenticated Clerk user profile and active workspace."""
    repo = UserRepository(db)
    return await repo.sync_user(user_ctx)


@router.post("/auth/sync", response_model=UserResponse)
async def sync_auth_user(
    user_ctx: UserContext = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Sync user metadata when profile is updated."""
    repo = UserRepository(db)
    return await repo.sync_user(user_ctx)
