"""
FastAPI routes for BrandBrew — AI Content Strategist.

Architecture:
  - Clerk authentication enforced on all protected endpoints
  - Clean brand access authorization boundary: get_current_user() -> verify_brand_access()
  - Multi-tenant brand scoping across all repository queries
  - Deterministic 2-stage recommendation engine (Candidate Generation -> Scoring)
  - Persisted opportunity reads for instant dashboard loads
"""
from __future__ import annotations

import re
import uuid
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.database import get_db
from app.core.logging_config import get_logger
from app.models.schemas import (
    AnalyzeResponse,
    ApiResponse,
    Brand,
    BrandAudience,
    BrandStats,
    CalendarEntry,
    ContentDraft,
    ContentStatus,
    CreateBrandRequest,
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
from app.services.auth_service import get_current_user, verify_brand_access
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
    user: UserContext = Depends(get_current_user),
):
    """List all accessible brands in the current user's workspace."""
    repo = BrandRepository(db)
    workspace_id = user.workspace_id or "default_workspace"
    brands = await repo.list_all(workspace_id=workspace_id)
    logger.info("GET /api/brands -> %d brands returned for workspace '%s'", len(brands), workspace_id)
    return brands


@router.get("/brands/{brand_id}", response_model=Brand)
async def get_brand_by_id(
    brand_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Retrieve brand profile and guidelines by brand_id after verifying access."""
    repo = BrandRepository(db)
    brand = await verify_brand_access(brand_id, user, repo)
    return brand


@router.get("/brand", response_model=Brand)
async def get_default_brand(
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Backwards-compatible endpoint for active brand profile."""
    repo = BrandRepository(db)
    workspace_id = user.workspace_id or "default_workspace"
    brands = await repo.list_all(workspace_id=workspace_id)
    if not brands:
        raise HTTPException(status_code=404, detail="No brands found in workspace")
    return brands[0]


@router.patch("/brands/{brand_id}", response_model=Brand)
@router.patch("/brand", response_model=Brand)
async def update_brand(
    updates: UpdateBrandRequest,
    brand_id: str = "snitch",
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Update brand guidelines or active campaign name."""
    repo = BrandRepository(db)
    brand = await verify_brand_access(brand_id, user, repo)

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


@router.post("/brands", response_model=Brand, status_code=status.HTTP_201_CREATED)
async def create_brand(
    req: CreateBrandRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Create a new brand inside the authenticated user's workspace."""
    repo = BrandRepository(db)
    workspace_id = user.workspace_id or "default_workspace"

    # Resolve brand ID: use provided custom ID or slugify from name
    if req.id:
        brand_id = re.sub(r"[^a-z0-9-]", "-", req.id.lower().strip()).strip("-")
    else:
        brand_id = re.sub(r"[^a-z0-9]+", "-", req.name.lower().strip()).strip("-")

    # 409 Conflict if ID already exists
    existing = await repo.get_by_id(brand_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A brand with ID '{brand_id}' already exists. Choose a different name or provide a unique ID.",
        )

    # Validate tone (1–5 items)
    tone = [t.strip() for t in req.tone if t.strip()]
    if not tone:
        tone = ["Confident"]
    tone = tone[:5]

    audience = req.audience or BrandAudience(
        age_range="18-28",
        location="India",
        interests=[],
        shopping_behavior=[],
    )

    new_brand = Brand(
        id=brand_id,
        workspace_id=workspace_id,
        name=req.name.strip(),
        description=(req.description or "").strip(),
        tone=tone,
        campaign=req.campaign.strip(),
        audience=audience,
    )
    created = await repo.create(new_brand)
    logger.info("POST /api/brands -> created brand id='%s' name='%s' workspace='%s'", created.id, created.name, workspace_id)
    return created


@router.get("/brands/{brand_id}/stats", response_model=BrandStats)
async def get_brand_stats(
    brand_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Return counts of dependent records for a brand after verifying access."""
    repo = BrandRepository(db)
    await verify_brand_access(brand_id, user, repo)
    counts = await repo.get_brand_stats(brand_id)
    return BrandStats(
        brand_id=brand_id,
        products=counts["products"],
        historical_posts=counts["historical_posts"],
        opportunities=counts["opportunities"],
        content_drafts=counts["content_drafts"],
        calendar_entries=counts["calendar_entries"],
    )


@router.delete("/brands/{brand_id}")
async def delete_brand(
    brand_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Delete a brand and all its dependent records. Prevents deleting the last remaining brand."""
    repo = BrandRepository(db)
    await verify_brand_access(brand_id, user, repo)

    workspace_id = user.workspace_id or "default_workspace"
    remaining = await repo.list_all(workspace_id=workspace_id)
    if len(remaining) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last remaining brand. At least one brand must exist.",
        )

    await repo.delete(brand_id)
    logger.info("DELETE /api/brands/%s -> brand and cascade deleted by user='%s'", brand_id, user.clerk_user_id)
    return {"status": "ok", "message": f"Brand '{brand_id}' and all its data have been permanently deleted."}


# ── Products & Catalog ────────────────────────────────────────────────────────

@router.get("/brands/{brand_id}/products", response_model=list[Product])
@router.get("/products", response_model=list[Product])
async def list_products(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """List catalog products scoped by brand_id after verifying access."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    return await ProductRepository(db).list_all(brand_id=effective_brand_id)


@router.post("/brands/{brand_id}/products", response_model=Product, status_code=status.HTTP_201_CREATED)
@router.post("/products", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product(
    req: CreateProductRequest,
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Create a new product in the brand catalog."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    product_id = f"prod_{uuid.uuid4().hex[:8]}"
    product = Product(
        id=product_id,
        brand_id=effective_brand_id,
        name=req.name,
        category=req.category,
        price_inr=req.price_inr,
        description=req.description or "",
        features=req.features or [],
        season=req.season or "All Season",
        target_audience=req.target_audience or "Young Adults",
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
    user: UserContext = Depends(get_current_user),
):
    """Delete a product from the brand catalog after verifying access."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
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
    user: UserContext = Depends(get_current_user),
):
    """List historical social performance posts scoped by brand_id."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    return await PostRepository(db).list_all(brand_id=effective_brand_id)


@router.get("/brands/{brand_id}/performance")
@router.get("/performance")
async def get_performance(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Compute deterministic performance summary and format benchmarks."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    posts = await PostRepository(db).list_all(brand_id=effective_brand_id)
    return AnalyticsService().compute_summary(posts)


# ── Recommendation Engine & Opportunities ─────────────────────────────────────

@router.get("/brands/{brand_id}/opportunities", response_model=list[Opportunity])
@router.get("/opportunities", response_model=list[Opportunity])
async def list_opportunities(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Read persisted ranked opportunities from database for authorized brand."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    opps = await OpportunityRepository(db).list_all(brand_id=effective_brand_id)
    opps = opps[:5]

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
    user: UserContext = Depends(get_current_user),
):
    """Trigger 2-stage recommendation engine for authorized brand."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    logger.info("POST /api/analyze for brand_id='%s'", effective_brand_id)
    try:
        svc = _make_strategist(db)
        result = await svc.analyze(brand_id=effective_brand_id)
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
    user: UserContext = Depends(get_current_user),
):
    """Get single opportunity, verifying brand authorization."""
    repo = OpportunityRepository(db)
    opp = await repo.get_by_id(opportunity_id, brand_id=brand_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    await verify_brand_access(opp.brand_id, user, BrandRepository(db))

    product = await ProductRepository(db).get_by_id(opp.suggested_product_id, brand_id=opp.brand_id)
    if product:
        opp.suggested_product_name = product.name
    return opp


# ── Content Studio & Generation ───────────────────────────────────────────────

@router.post("/content/generate", response_model=ContentDraft)
async def generate_content(
    req: GenerateContentRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Generate production-ready content draft from an opportunity after verifying brand access."""
    opp = await OpportunityRepository(db).get_by_id(req.opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    await verify_brand_access(opp.brand_id, user, BrandRepository(db))

    try:
        svc = _make_content_service(db)
        return await svc.generate(req)
    except ValueError as exc:
        logger.error("Content generation failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error in content generation: %s", exc)
        raise HTTPException(status_code=500, detail="Content generation failed. Please try again.")


@router.get("/content/{draft_id}", response_model=ContentDraft)
async def get_draft(
    draft_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Fetch content draft by ID after verifying brand access."""
    draft = await ContentRepository(db).get_by_id(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    await verify_brand_access(draft.brand_id, user, BrandRepository(db))
    return draft


@router.patch("/content/{draft_id}", response_model=ContentDraft)
async def update_draft(
    draft_id: str,
    updates: UpdateDraftRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Update draft copy, slides, hashtags, or CTA after verifying brand access."""
    repo = ContentRepository(db)
    draft = await repo.get_by_id(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    await verify_brand_access(draft.brand_id, user, BrandRepository(db))

    if updates.slides is not None:
        draft.slides = updates.slides
    if updates.caption is not None:
        draft.caption = updates.caption
    if updates.cta is not None:
        draft.cta = updates.cta
    if updates.hashtags is not None:
        draft.hashtags = updates.hashtags

    return await repo.update(draft, brand_id=draft.brand_id)


@router.post("/content/{draft_id}/schedule", response_model=ContentDraft)
async def schedule_draft(
    draft_id: str,
    req: ScheduleRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Schedule content draft and create/update calendar entry after verifying brand access."""
    draft = await ContentRepository(db).get_by_id(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    await verify_brand_access(draft.brand_id, user, BrandRepository(db))

    svc = _make_content_service(db)
    return await svc.schedule_draft(draft_id, req)


# ── Editorial Calendar ────────────────────────────────────────────────────────

@router.get("/brands/{brand_id}/calendar", response_model=list[CalendarEntry])
@router.get("/calendar", response_model=list[CalendarEntry])
async def list_calendar(
    brand_id: str | None = None,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """List all scheduled and draft posts on the editorial calendar for authorized brand."""
    effective_brand_id = brand_id or "snitch"
    await verify_brand_access(effective_brand_id, user, BrandRepository(db))
    return await CalendarRepository(db).list_all(brand_id=effective_brand_id)


@router.patch("/calendar/{entry_id}", response_model=CalendarEntry)
async def update_calendar_entry(
    entry_id: str,
    payload: dict,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Update scheduled date or status of a calendar post after verifying brand access."""
    cal_repo = CalendarRepository(db)
    content_repo = ContentRepository(db)

    entry = await cal_repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")
    await verify_brand_access(entry.brand_id, user, BrandRepository(db))

    if "scheduled_datetime" in payload:
        new_dt = payload["scheduled_datetime"]
        entry.scheduled_datetime = new_dt
        if entry.draft_id:
            draft = await content_repo.get_by_id(entry.draft_id, brand_id=entry.brand_id)
            if draft:
                parts = new_dt.split("T")
                draft.scheduled_date = parts[0]
                if len(parts) > 1:
                    draft.scheduled_time = parts[1][:5]
                draft.status = ContentStatus.SCHEDULED
                await content_repo.update(draft, brand_id=entry.brand_id)

    if "status" in payload:
        try:
            entry.status = ContentStatus(payload["status"])
        except ValueError:
            pass

    await cal_repo.upsert(entry, brand_id=entry.brand_id)
    return entry


@router.delete("/calendar/{entry_id}", response_model=ApiResponse)
async def delete_calendar_entry(
    entry_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
    user: UserContext = Depends(get_current_user),
):
    """Delete a calendar entry after verifying brand access."""
    cal_repo = CalendarRepository(db)
    content_repo = ContentRepository(db)

    entry = await cal_repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")
    await verify_brand_access(entry.brand_id, user, BrandRepository(db))

    if entry.draft_id:
        draft = await content_repo.get_by_id(entry.draft_id, brand_id=entry.brand_id)
        if draft:
            draft.status = ContentStatus.APPROVED
            draft.scheduled_date = None
            draft.scheduled_time = None
            await content_repo.update(draft, brand_id=entry.brand_id)

    await cal_repo.delete(entry_id, brand_id=entry.brand_id)
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

