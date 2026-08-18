"""
FastAPI routes for Helium Content Copilot.

All AI calls are server-side. API keys never reach the frontend.
Every endpoint validates inputs/outputs via Pydantic schemas.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.core.logging_config import get_logger
from app.models.schemas import (
    AnalyzeResponse,
    ApiResponse,
    CalendarEntry,
    ContentDraft,
    ContentStatus,
    GenerateContentRequest,
    Opportunity,
    Product,
    ScheduleRequest,
    UpdateDraftRequest,
)
from app.services.ai.providers import get_ai_provider
from app.services.analytics import AnalyticsService
from app.services.content_generator import ContentGeneratorService
from app.services.repositories import (
    BrandRepository,
    CalendarRepository,
    ContentRepository,
    OpportunityRepository,
    PostRepository,
    ProductRepository,
)
from app.services.scoring import ScoringService
from app.services.strategist import StrategistService

import aiosqlite

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
    return StrategistService(
        brand_repo=BrandRepository(db),
        product_repo=ProductRepository(db),
        post_repo=PostRepository(db),
        opportunity_repo=OpportunityRepository(db),
        analytics=analytics,
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


# ── Brand & Data Endpoints ─────────────────────────────────────────────────────

@router.get("/brand")
async def get_brand(db: aiosqlite.Connection = Depends(get_db_conn)):
    brand = await BrandRepository(db).get()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    logger.info("GET /api/brand")
    return brand


@router.get("/products", response_model=list[Product])
async def get_products(db: aiosqlite.Connection = Depends(get_db_conn)):
    logger.info("GET /api/products")
    return await ProductRepository(db).list_all()


@router.get("/posts")
async def get_posts(db: aiosqlite.Connection = Depends(get_db_conn)):
    logger.info("GET /api/posts")
    return await PostRepository(db).list_all()


@router.get("/performance")
async def get_performance(db: aiosqlite.Connection = Depends(get_db_conn)):
    logger.info("GET /api/performance")
    posts = await PostRepository(db).list_all()
    return AnalyticsService().compute_summary(posts)


# ── Analysis Endpoint ──────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_brand(db: aiosqlite.Connection = Depends(get_db_conn)):
    """
    Core endpoint: runs the full AI + deterministic scoring pipeline.
    Returns ranked content opportunities with scores and explanations.
    """
    logger.info("POST /api/analyze — starting full pipeline")
    try:
        svc = _make_strategist(db)
        result = await svc.analyze()
        logger.info(
            "Analysis complete | %d opportunities | is_demo=%s | top_score=%s",
            len(result.opportunities),
            result.is_demo,
            result.opportunities[0].score if result.opportunities else "N/A",
        )
        return result
    except ValueError as exc:
        logger.error("Analysis failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(status_code=500, detail="Analysis failed. Please try again.")


# ── Opportunities Endpoints ────────────────────────────────────────────────────

@router.get("/opportunities", response_model=list[Opportunity])
async def list_opportunities(db: aiosqlite.Connection = Depends(get_db_conn)):
    logger.info("GET /api/opportunities")
    opps = await OpportunityRepository(db).list_all()
    # Enrich product names
    product_repo = ProductRepository(db)
    for opp in opps:
        product = await product_repo.get_by_id(opp.suggested_product_id)
        if product:
            opp.suggested_product_name = product.name
    return opps


@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def get_opportunity(
    opportunity_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    logger.info("GET /api/opportunities/%s", opportunity_id)
    opp = await OpportunityRepository(db).get_by_id(opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    product = await ProductRepository(db).get_by_id(opp.suggested_product_id)
    if product:
        opp.suggested_product_name = product.name
    return opp


# ── Content Generation Endpoints ───────────────────────────────────────────────

@router.post("/content/generate", response_model=ContentDraft)
async def generate_content(
    request: GenerateContentRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    logger.info("POST /api/content/generate | opportunity_id=%s", request.opportunity_id)
    try:
        svc = _make_content_service(db)
        return await svc.generate(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        logger.exception("Content generation failed")
        raise HTTPException(status_code=500, detail="Content generation failed. Please try again.")


@router.post("/content/regenerate", response_model=ContentDraft)
async def regenerate_content(
    request: GenerateContentRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    """Regenerate content with the same parameters (random LLM seed gives variation)."""
    logger.info("POST /api/content/regenerate | opportunity_id=%s", request.opportunity_id)
    try:
        svc = _make_content_service(db)
        return await svc.generate(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        logger.exception("Content regeneration failed")
        raise HTTPException(status_code=500, detail="Regeneration failed. Please try again.")


@router.get("/content/{draft_id}", response_model=ContentDraft)
async def get_draft(draft_id: str, db: aiosqlite.Connection = Depends(get_db_conn)):
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
    logger.info("PATCH /api/content/%s", draft_id)
    try:
        svc = _make_content_service(db)
        return await svc.update(draft_id, updates)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/content/{draft_id}/approve", response_model=ContentDraft)
async def approve_content(
    draft_id: str,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    logger.info("POST /api/content/%s/approve", draft_id)
    try:
        svc = _make_content_service(db)
        return await svc.approve(draft_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/content/{draft_id}/schedule", response_model=ContentDraft)
async def schedule_content(
    draft_id: str,
    schedule: ScheduleRequest,
    db: aiosqlite.Connection = Depends(get_db_conn),
):
    logger.info(
        "POST /api/content/%s/schedule | %s %s",
        draft_id, schedule.scheduled_date, schedule.scheduled_time,
    )
    try:
        svc = _make_content_service(db)
        return await svc.schedule(draft_id, schedule)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# ── Calendar Endpoint ──────────────────────────────────────────────────────────

@router.get("/calendar", response_model=list[CalendarEntry])
async def get_calendar(db: aiosqlite.Connection = Depends(get_db_conn)):
    logger.info("GET /api/calendar")
    return await CalendarRepository(db).list_all()


@router.delete("/calendar/{entry_id}")
async def delete_calendar_entry(entry_id: str, db: aiosqlite.Connection = Depends(get_db_conn)):
    logger.info("DELETE /api/calendar/%s", entry_id)
    cal_repo = CalendarRepository(db)
    entry = await cal_repo.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Calendar entry not found")
    
    await cal_repo.delete(entry_id)
    
    if entry.draft_id:
        content_repo = ContentRepository(db)
        draft = await content_repo.get_by_id(entry.draft_id)
        if draft:
            draft = draft.model_copy(update={
                "status": ContentStatus.APPROVED,
                "scheduled_date": None,
                "scheduled_time": None,
            })
            await content_repo.update(draft)
            
    return {"status": "ok", "message": f"Calendar entry {entry_id} removed"}


# ── Health Check ───────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "helium-content-copilot"}
