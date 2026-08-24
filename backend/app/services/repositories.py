"""
Repository layer — clean, typed, brand-scoped access to persistent tables.

Pattern:
  BaseRepository[T]  →  concrete repos per entity.
  All brand-owned entity queries are explicitly scoped by `brand_id`.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Generic, TypeVar

import aiosqlite

from app.core.logging_config import get_logger
from app.models.schemas import (
    Brand,
    BrandAudience,
    CalendarEntry,
    ContentDraft,
    ContentStatus,
    CarouselSlide,
    Confidence,
    HistoricalPost,
    InventoryStatus,
    Opportunity,
    Product,
    ScoreBreakdown,
    UserResponse,
    UserContext,
)

logger = get_logger(__name__)

T = TypeVar("T")


# ──────────────────────────────────────────────────────────────────────────────
# Base Repository
# ──────────────────────────────────────────────────────────────────────────────

class BaseRepository(Generic[T]):
    """Abstract base providing common helpers for concrete repositories."""

    def __init__(self, db: aiosqlite.Connection) -> None:
        self._db = db

    @staticmethod
    def _new_id() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()


# ──────────────────────────────────────────────────────────────────────────────
# Brand Repository
# ──────────────────────────────────────────────────────────────────────────────

class BrandRepository(BaseRepository[Brand]):
    """Access to brand profiles and workspace tenancy."""

    async def list_all(self, workspace_id: str | None = None) -> list[Brand]:
        logger.debug("BrandRepository.list_all(workspace_id=%s)", workspace_id)
        if workspace_id:
            query = "SELECT * FROM brands WHERE workspace_id = ? ORDER BY name ASC"
            params = (workspace_id,)
        else:
            query = "SELECT * FROM brands ORDER BY name ASC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_brand(r) for r in rows]

    async def get_by_id(self, brand_id: str) -> Brand | None:
        logger.debug("BrandRepository.get_by_id(brand_id='%s')", brand_id)
        async with self._db.execute("SELECT * FROM brands WHERE id = ?", (brand_id,)) as cursor:
            row = await cursor.fetchone()
        return self._row_to_brand(row) if row else None

    async def get(self) -> Brand | None:
        """Backwards-compatible getter for default brand (SNITCH)."""
        brand = await self.get_by_id("snitch")
        if brand:
            return brand
        async with self._db.execute("SELECT * FROM brands LIMIT 1") as cursor:
            row = await cursor.fetchone()
        return self._row_to_brand(row) if row else None

    async def create(self, brand: Brand) -> Brand:
        logger.info("Creating brand id=%s name='%s'", brand.id, brand.name)
        now = self._now_iso()
        await self._db.execute(
            """INSERT INTO brands (id, workspace_id, name, description, tone, audience, campaign, created_at, updated_at)
               VALUES (:id, :workspace_id, :name, :description, :tone, :audience, :campaign, :created_at, :updated_at)""",
            {
                "id": brand.id,
                "workspace_id": brand.workspace_id,
                "name": brand.name,
                "description": brand.description,
                "tone": json.dumps(brand.tone),
                "audience": json.dumps(brand.audience.model_dump()),
                "campaign": brand.campaign,
                "created_at": now,
                "updated_at": now,
            },
        )
        await self._db.commit()
        return brand

    async def update(self, brand: Brand) -> Brand:
        logger.info("Updating brand id=%s campaign='%s'", brand.id, brand.campaign)
        now = self._now_iso()
        await self._db.execute(
            """UPDATE brands SET
                name=:name, description=:description, tone=:tone,
                audience=:audience, campaign=:campaign, updated_at=:updated_at
            WHERE id=:id""",
            {
                "id": brand.id,
                "name": brand.name,
                "description": brand.description,
                "tone": json.dumps(brand.tone),
                "audience": json.dumps(brand.audience.model_dump()),
                "campaign": brand.campaign,
                "updated_at": now,
            },
        )
        await self._db.commit()
        return brand

    async def get_brand_stats(self, brand_id: str) -> dict:
        """Return counts of all dependent records for a brand (for deletion confirmation UI)."""
        counts = {}
        for table in ("products", "historical_posts", "opportunities", "content_drafts", "calendar_entries"):
            async with self._db.execute(
                f"SELECT COUNT(*) FROM {table} WHERE brand_id = ?", (brand_id,)
            ) as cursor:
                row = await cursor.fetchone()
                counts[table] = row[0] if row else 0
        return counts

    async def delete(self, brand_id: str) -> None:
        """
        Delete a brand and all its dependent records inside a single transaction.
        Relies on PRAGMA foreign_keys=ON + ON DELETE CASCADE defined in the schema.
        Falls back to manual cascade deletion for compatibility with existing SQLite dbs
        that were created before CASCADE was added to the schema.
        """
        logger.info("Deleting brand id=%s with cascade", brand_id)
        try:
            # CASCADE will handle dependent rows when foreign_keys=ON
            await self._db.execute("DELETE FROM brands WHERE id = ?", (brand_id,))
            await self._db.commit()
        except Exception as e:
            logger.warning("Cascade delete failed, falling back to manual cascade: %s", e)
            await self._db.rollback()
            # Manual cascade as fallback (for existing DBs without cascade constraints)
            for table in ("calendar_entries", "content_drafts", "opportunities", "historical_posts", "products"):
                await self._db.execute(f"DELETE FROM {table} WHERE brand_id = ?", (brand_id,))
            await self._db.execute("DELETE FROM brands WHERE id = ?", (brand_id,))
            await self._db.commit()

    @staticmethod
    def _row_to_brand(row: aiosqlite.Row) -> Brand:
        return Brand(
            id=row["id"],
            workspace_id=row["workspace_id"] if "workspace_id" in row.keys() else "default_workspace",
            name=row["name"],
            description=row["description"],
            tone=json.loads(row["tone"]),
            audience=BrandAudience(**json.loads(row["audience"])),
            campaign=row["campaign"],
        )


# ──────────────────────────────────────────────────────────────────────────────
# Product Repository
# ──────────────────────────────────────────────────────────────────────────────

class ProductRepository(BaseRepository[Product]):
    async def list_all(self, brand_id: str | None = None) -> list[Product]:
        logger.debug("ProductRepository.list_all(brand_id=%s)", brand_id)
        if brand_id:
            query = "SELECT * FROM products WHERE brand_id = ? ORDER BY views DESC"
            params = (brand_id,)
        else:
            query = "SELECT * FROM products ORDER BY views DESC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_product(r) for r in rows]

    async def get_by_id(self, product_id: str, brand_id: str | None = None) -> Product | None:
        if brand_id:
            query = "SELECT * FROM products WHERE id = ? AND brand_id = ?"
            params = (product_id, brand_id)
        else:
            query = "SELECT * FROM products WHERE id = ?"
            params = (product_id,)
        async with self._db.execute(query, params) as cursor:
            row = await cursor.fetchone()
        return self._row_to_product(row) if row else None

    async def create(self, product: Product, brand_id: str | None = None) -> Product:
        effective_brand_id = brand_id or product.brand_id or "snitch"
        product.brand_id = effective_brand_id
        logger.info("Creating product id=%s name='%s' brand_id=%s", product.id, product.name, effective_brand_id)
        now = self._now_iso()
        await self._db.execute(
            """INSERT INTO products (
                id, brand_id, name, category, price_inr, description, features,
                season, target_audience, inventory_status, views, sales, created_at, updated_at
            ) VALUES (
                :id, :brand_id, :name, :category, :price_inr, :description, :features,
                :season, :target_audience, :inventory_status, :views, :sales, :created_at, :updated_at
            )""",
            {
                "id": product.id,
                "brand_id": effective_brand_id,
                "name": product.name,
                "category": product.category,
                "price_inr": product.price_inr,
                "description": product.description,
                "features": json.dumps(product.features),
                "season": product.season,
                "target_audience": product.target_audience,
                "inventory_status": product.inventory_status.value
                if hasattr(product.inventory_status, "value")
                else str(product.inventory_status),
                "views": product.views,
                "sales": product.sales,
                "created_at": now,
                "updated_at": now,
            },
        )
        await self._db.commit()
        return product

    async def delete(self, product_id: str, brand_id: str | None = None) -> None:
        logger.info("Deleting product id=%s brand_id=%s", product_id, brand_id)
        if brand_id:
            await self._db.execute("DELETE FROM products WHERE id = ? AND brand_id = ?", (product_id, brand_id))
        else:
            await self._db.execute("DELETE FROM products WHERE id = ?", (product_id,))
        await self._db.commit()

    @staticmethod
    def _row_to_product(row: aiosqlite.Row) -> Product:
        return Product(
            id=row["id"],
            brand_id=row["brand_id"] if "brand_id" in row.keys() else "snitch",
            name=row["name"],
            category=row["category"],
            price_inr=row["price_inr"],
            description=row["description"],
            features=json.loads(row["features"]),
            season=row["season"],
            target_audience=row["target_audience"],
            inventory_status=InventoryStatus(row["inventory_status"]),
            views=row["views"],
            sales=row["sales"],
        )


# ──────────────────────────────────────────────────────────────────────────────
# Historical Post Repository
# ──────────────────────────────────────────────────────────────────────────────

class PostRepository(BaseRepository[HistoricalPost]):
    async def list_all(self, brand_id: str | None = None) -> list[HistoricalPost]:
        logger.debug("PostRepository.list_all(brand_id=%s)", brand_id)
        if brand_id:
            query = "SELECT * FROM historical_posts WHERE brand_id = ? ORDER BY posted_date DESC"
            params = (brand_id,)
        else:
            query = "SELECT * FROM historical_posts ORDER BY posted_date DESC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_post(r) for r in rows]

    async def create(self, post: HistoricalPost, brand_id: str | None = None) -> HistoricalPost:
        effective_brand_id = brand_id or post.brand_id or "snitch"
        post.brand_id = effective_brand_id
        await self._db.execute(
            """INSERT INTO historical_posts (
                id, brand_id, platform, format, caption, product_id, category,
                audience, objective, posted_date, impressions, likes, comments,
                shares, saves, clicks, conversions
            ) VALUES (
                :id, :brand_id, :platform, :format, :caption, :product_id, :category,
                :audience, :objective, :posted_date, :impressions, :likes, :comments,
                :shares, :saves, :clicks, :conversions
            )""",
            {
                "id": post.id,
                "brand_id": effective_brand_id,
                "platform": post.platform,
                "format": post.format,
                "caption": post.caption,
                "product_id": post.product_id,
                "category": post.category,
                "audience": post.audience,
                "objective": post.objective,
                "posted_date": post.posted_date,
                "impressions": post.impressions,
                "likes": post.likes,
                "comments": post.comments,
                "shares": post.shares,
                "saves": post.saves,
                "clicks": post.clicks,
                "conversions": post.conversions,
            },
        )
        await self._db.commit()
        return post

    @staticmethod
    def _row_to_post(row: aiosqlite.Row) -> HistoricalPost:
        return HistoricalPost(
            id=row["id"],
            brand_id=row["brand_id"] if "brand_id" in row.keys() else "snitch",
            platform=row["platform"],
            format=row["format"],
            caption=row["caption"],
            product_id=row["product_id"],
            category=row["category"],
            audience=row["audience"],
            objective=row["objective"],
            posted_date=row["posted_date"],
            impressions=row["impressions"],
            likes=row["likes"],
            comments=row["comments"],
            shares=row["shares"],
            saves=row["saves"],
            clicks=row["clicks"],
            conversions=row["conversions"],
        )


# ──────────────────────────────────────────────────────────────────────────────
# Opportunity Repository
# ──────────────────────────────────────────────────────────────────────────────

class OpportunityRepository(BaseRepository[Opportunity]):
    async def save_all(
        self,
        opportunities: list[Opportunity],
        brand_id: str | None = None,
        analysis_run_id: str | None = None,
    ) -> None:
        effective_brand_id = brand_id or (opportunities[0].brand_id if opportunities else "snitch")
        logger.info("Saving %d opportunities to DB for brand='%s'", len(opportunities), effective_brand_id)
        
        # Delete previous unreferenced opportunities for this brand to prevent stale duplicates while respecting FK constraints
        await self._db.execute(
            """DELETE FROM opportunities 
               WHERE brand_id = ? 
                 AND id NOT IN (SELECT opportunity_id FROM content_drafts WHERE opportunity_id IS NOT NULL AND brand_id = ?)""",
            (effective_brand_id, effective_brand_id),
        )
        for opp in opportunities:
            opp.brand_id = effective_brand_id
            if analysis_run_id:
                opp.analysis_run_id = analysis_run_id
            await self._db.execute(
                """INSERT OR REPLACE INTO opportunities (
                    id, brand_id, analysis_run_id, title, content_angle, audience, objective,
                    platform, format, suggested_product_id, why, historical_signal,
                    product_signal, audience_signal, seasonal_signal, business_signal,
                    score, score_breakdown, confidence, confidence_reason, created_at, is_demo
                ) VALUES (
                    :id, :brand_id, :analysis_run_id, :title, :content_angle, :audience, :objective,
                    :platform, :format, :suggested_product_id, :why, :historical_signal,
                    :product_signal, :audience_signal, :seasonal_signal, :business_signal,
                    :score, :score_breakdown, :confidence, :confidence_reason, :created_at, :is_demo
                )""",
                {
                    "id": opp.id,
                    "brand_id": effective_brand_id,
                    "analysis_run_id": opp.analysis_run_id,
                    "title": opp.title,
                    "content_angle": opp.content_angle,
                    "audience": opp.audience,
                    "objective": opp.objective,
                    "platform": opp.platform,
                    "format": opp.format,
                    "suggested_product_id": opp.suggested_product_id,
                    "why": opp.why,
                    "historical_signal": opp.historical_signal,
                    "product_signal": opp.product_signal,
                    "audience_signal": opp.audience_signal,
                    "seasonal_signal": opp.seasonal_signal,
                    "business_signal": opp.business_signal,
                    "score": opp.score,
                    "score_breakdown": opp.score_breakdown.model_dump_json(),
                    "confidence": opp.confidence.value
                    if hasattr(opp.confidence, "value")
                    else str(opp.confidence),
                    "confidence_reason": opp.confidence_reason,
                    "created_at": opp.created_at,
                    "is_demo": int(opp.is_demo),
                },
            )
        await self._db.commit()

    async def list_all(self, brand_id: str | None = None) -> list[Opportunity]:
        logger.debug("OpportunityRepository.list_all(brand_id=%s)", brand_id)
        if brand_id:
            query = "SELECT * FROM opportunities WHERE brand_id = ? ORDER BY score DESC"
            params = (brand_id,)
        else:
            query = "SELECT * FROM opportunities ORDER BY score DESC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_opportunity(r) for r in rows]

    async def get_by_id(self, opportunity_id: str, brand_id: str | None = None) -> Opportunity | None:
        if brand_id:
            query = "SELECT * FROM opportunities WHERE id = ? AND brand_id = ?"
            params = (opportunity_id, brand_id)
        else:
            query = "SELECT * FROM opportunities WHERE id = ?"
            params = (opportunity_id,)
        async with self._db.execute(query, params) as cursor:
            row = await cursor.fetchone()
        return self._row_to_opportunity(row) if row else None

    @staticmethod
    def _row_to_opportunity(row: aiosqlite.Row) -> Opportunity:
        raw_sb = row["score_breakdown"]
        breakdown_data = {}
        if raw_sb:
            try:
                breakdown_data = json.loads(raw_sb) if isinstance(raw_sb, str) else raw_sb
            except Exception:
                breakdown_data = {}
        if not isinstance(breakdown_data, dict):
            breakdown_data = {}

        score_breakdown = ScoreBreakdown(
            historical=int(breakdown_data.get("historical", 0)),
            product=int(breakdown_data.get("product", 0)),
            audience=int(breakdown_data.get("audience", 0)),
            seasonal=int(breakdown_data.get("seasonal", 0)),
            objective=int(breakdown_data.get("objective", 0)),
        )

        return Opportunity(
            id=row["id"],
            brand_id=row["brand_id"] if "brand_id" in row.keys() else "snitch",
            analysis_run_id=row["analysis_run_id"] if "analysis_run_id" in row.keys() else None,
            title=row["title"],
            content_angle=row["content_angle"],
            audience=row["audience"],
            objective=row["objective"],
            platform=row["platform"],
            format=row["format"],
            suggested_product_id=row["suggested_product_id"],
            suggested_product_name="",  # enriched at API layer
            why=row["why"],
            historical_signal=row["historical_signal"],
            product_signal=row["product_signal"],
            audience_signal=row["audience_signal"],
            seasonal_signal=row["seasonal_signal"],
            business_signal=row["business_signal"],
            score=row["score"],
            score_breakdown=score_breakdown,
            confidence=Confidence.HIGH if (row["confidence"] or "").lower() in ("high", "good") else Confidence.MEDIUM if (row["confidence"] or "").lower() in ("medium", "moderate") else Confidence.LOW,
            confidence_reason=row["confidence_reason"],
            created_at=row["created_at"],
            is_demo=bool(row["is_demo"]),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Content Draft Repository
# ──────────────────────────────────────────────────────────────────────────────

class ContentRepository(BaseRepository[ContentDraft]):
    async def create(self, draft: ContentDraft, brand_id: str | None = None) -> ContentDraft:
        effective_brand_id = brand_id or draft.brand_id or "snitch"
        draft.brand_id = effective_brand_id
        logger.info("Creating content draft id=%s brand_id=%s status=%s", draft.id, effective_brand_id, draft.status)
        await self._db.execute(
            """INSERT INTO content_drafts (
                id, brand_id, opportunity_id, platform, format, audience, objective,
                slides, caption, cta, hashtags, status,
                scheduled_date, scheduled_time, created_at, updated_at, is_demo
            ) VALUES (
                :id, :brand_id, :opportunity_id, :platform, :format, :audience, :objective,
                :slides, :caption, :cta, :hashtags, :status,
                :scheduled_date, :scheduled_time, :created_at, :updated_at, :is_demo
            )""",
            {
                "id": draft.id,
                "brand_id": effective_brand_id,
                "opportunity_id": draft.opportunity_id,
                "platform": draft.platform,
                "format": draft.format,
                "audience": draft.audience,
                "objective": draft.objective,
                "slides": json.dumps([s.model_dump() for s in draft.slides]),
                "caption": draft.caption,
                "cta": draft.cta,
                "hashtags": json.dumps(draft.hashtags),
                "status": draft.status.value if hasattr(draft.status, "value") else str(draft.status),
                "scheduled_date": draft.scheduled_date,
                "scheduled_time": draft.scheduled_time,
                "created_at": draft.created_at,
                "updated_at": draft.updated_at,
                "is_demo": int(draft.is_demo),
            },
        )
        await self._db.commit()
        return draft

    async def list_all(self, brand_id: str | None = None) -> list[ContentDraft]:
        if brand_id:
            query = "SELECT * FROM content_drafts WHERE brand_id = ? ORDER BY created_at DESC"
            params = (brand_id,)
        else:
            query = "SELECT * FROM content_drafts ORDER BY created_at DESC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_draft(r) for r in rows]

    async def get_by_id(self, draft_id: str, brand_id: str | None = None) -> ContentDraft | None:
        if brand_id:
            query = "SELECT * FROM content_drafts WHERE id = ? AND brand_id = ?"
            params = (draft_id, brand_id)
        else:
            query = "SELECT * FROM content_drafts WHERE id = ?"
            params = (draft_id,)
        async with self._db.execute(query, params) as cursor:
            row = await cursor.fetchone()
        return self._row_to_draft(row) if row else None

    async def update(self, draft: ContentDraft, brand_id: str | None = None) -> ContentDraft:
        logger.info("Updating draft id=%s status=%s", draft.id, draft.status)
        if brand_id:
            query = """UPDATE content_drafts SET
                slides=:slides, caption=:caption, cta=:cta,
                hashtags=:hashtags, status=:status,
                scheduled_date=:scheduled_date, scheduled_time=:scheduled_time,
                updated_at=:updated_at
            WHERE id=:id AND brand_id=:brand_id"""
            params = {
                "id": draft.id,
                "brand_id": brand_id,
                "slides": json.dumps([s.model_dump() for s in draft.slides]),
                "caption": draft.caption,
                "cta": draft.cta,
                "hashtags": json.dumps(draft.hashtags),
                "status": draft.status.value if hasattr(draft.status, "value") else str(draft.status),
                "scheduled_date": draft.scheduled_date,
                "scheduled_time": draft.scheduled_time,
                "updated_at": self._now_iso(),
            }
        else:
            query = """UPDATE content_drafts SET
                slides=:slides, caption=:caption, cta=:cta,
                hashtags=:hashtags, status=:status,
                scheduled_date=:scheduled_date, scheduled_time=:scheduled_time,
                updated_at=:updated_at
            WHERE id=:id"""
            params = {
                "id": draft.id,
                "slides": json.dumps([s.model_dump() for s in draft.slides]),
                "caption": draft.caption,
                "cta": draft.cta,
                "hashtags": json.dumps(draft.hashtags),
                "status": draft.status.value if hasattr(draft.status, "value") else str(draft.status),
                "scheduled_date": draft.scheduled_date,
                "scheduled_time": draft.scheduled_time,
                "updated_at": self._now_iso(),
            }
        await self._db.execute(query, params)
        await self._db.commit()
        return draft

    @staticmethod
    def _row_to_draft(row: aiosqlite.Row) -> ContentDraft:
        return ContentDraft(
            id=row["id"],
            brand_id=row["brand_id"] if "brand_id" in row.keys() else "snitch",
            opportunity_id=row["opportunity_id"],
            platform=row["platform"],
            format=row["format"],
            audience=row["audience"],
            objective=row["objective"],
            slides=[CarouselSlide(**s) for s in json.loads(row["slides"])],
            caption=row["caption"],
            cta=row["cta"],
            hashtags=json.loads(row["hashtags"]),
            status=ContentStatus(row["status"]),
            scheduled_date=row["scheduled_date"],
            scheduled_time=row["scheduled_time"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            is_demo=bool(row["is_demo"]),
        )

    async def delete(self, draft_id: str) -> bool:
        """Delete a draft and its associated calendar entry. Returns True if deleted."""
        logger.info("Deleting content draft id=%s", draft_id)
        # Also remove any linked calendar entry so Calendar stays consistent
        await self._db.execute(
            "DELETE FROM calendar_entries WHERE draft_id = ?", (draft_id,)
        )
        cursor = await self._db.execute(
            "DELETE FROM content_drafts WHERE id = ?", (draft_id,)
        )
        await self._db.commit()
        return (cursor.rowcount or 0) > 0


# ──────────────────────────────────────────────────────────────────────────────
# Calendar Repository
# ──────────────────────────────────────────────────────────────────────────────

class CalendarRepository(BaseRepository[CalendarEntry]):
    async def upsert(self, entry: CalendarEntry, brand_id: str | None = None) -> None:
        effective_brand_id = brand_id or entry.brand_id or "snitch"
        entry.brand_id = effective_brand_id
        logger.info("Upserting calendar entry id=%s brand_id=%s", entry.id, effective_brand_id)
        await self._db.execute(
            """INSERT OR REPLACE INTO calendar_entries (
                id, brand_id, draft_id, title, platform, format, status, scheduled_datetime
            ) VALUES (
                :id, :brand_id, :draft_id, :title, :platform, :format, :status, :scheduled_datetime
            )""",
            {
                "id": entry.id,
                "brand_id": effective_brand_id,
                "draft_id": entry.draft_id,
                "title": entry.title,
                "platform": entry.platform,
                "format": entry.format,
                "status": entry.status.value if hasattr(entry.status, "value") else str(entry.status),
                "scheduled_datetime": entry.scheduled_datetime,
            },
        )
        await self._db.commit()


    async def list_all(self, brand_id: str | None = None) -> list[CalendarEntry]:
        if brand_id:
            query = "SELECT * FROM calendar_entries WHERE brand_id = ? ORDER BY scheduled_datetime ASC"
            params = (brand_id,)
        else:
            query = "SELECT * FROM calendar_entries ORDER BY scheduled_datetime ASC"
            params = ()
        async with self._db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
        return [
            CalendarEntry(
                id=r["id"],
                brand_id=r["brand_id"] if "brand_id" in r.keys() else "snitch",
                draft_id=r["draft_id"],
                title=r["title"],
                platform=r["platform"],
                format=r["format"],
                status=ContentStatus(r["status"]),
                scheduled_datetime=r["scheduled_datetime"],
            )
            for r in rows
        ]

    async def get_by_id(self, entry_id: str, brand_id: str | None = None) -> CalendarEntry | None:
        if brand_id:
            query = "SELECT * FROM calendar_entries WHERE id = ? AND brand_id = ?"
            params = (entry_id, brand_id)
        else:
            query = "SELECT * FROM calendar_entries WHERE id = ?"
            params = (entry_id,)
        async with self._db.execute(query, params) as cursor:
            row = await cursor.fetchone()
        if not row:
            return None
        return CalendarEntry(
            id=row["id"],
            brand_id=row["brand_id"] if "brand_id" in row.keys() else "snitch",
            draft_id=row["draft_id"],
            title=row["title"],
            platform=row["platform"],
            format=row["format"],
            status=ContentStatus(row["status"]),
            scheduled_datetime=row["scheduled_datetime"],
        )

    async def get_by_draft_id(self, draft_id: str, brand_id: str | None = None) -> CalendarEntry | None:
        if brand_id:
            query = "SELECT * FROM calendar_entries WHERE draft_id = ? AND brand_id = ?"
            params = (draft_id, brand_id)
        else:
            query = "SELECT * FROM calendar_entries WHERE draft_id = ?"
            params = (draft_id,)
        async with self._db.execute(query, params) as cursor:
            row = await cursor.fetchone()
        if not row:
            return None
        return CalendarEntry(
            id=row["id"],
            brand_id=row["brand_id"] if "brand_id" in row.keys() else "snitch",
            draft_id=row["draft_id"],
            title=row["title"],
            platform=row["platform"],
            format=row["format"],
            status=ContentStatus(row["status"]),
            scheduled_datetime=row["scheduled_datetime"],
        )

    async def delete(self, entry_id: str, brand_id: str | None = None) -> None:
        logger.info("Deleting calendar entry id=%s brand_id=%s", entry_id, brand_id)
        if brand_id:
            await self._db.execute("DELETE FROM calendar_entries WHERE id = ? AND brand_id = ?", (entry_id, brand_id))
        else:
            await self._db.execute("DELETE FROM calendar_entries WHERE id = ?", (entry_id,))
        await self._db.commit()


# ──────────────────────────────────────────────────────────────────────────────
# User Repository (Clerk User Sync)
# ──────────────────────────────────────────────────────────────────────────────

class UserRepository(BaseRepository[UserResponse]):
    """Handles synchronization and retrieval of Clerk-authenticated users."""

    async def get_by_clerk_id(self, clerk_user_id: str) -> UserResponse | None:
        async with self._db.execute(
            "SELECT * FROM users WHERE clerk_user_id = ?", (clerk_user_id,)
        ) as cursor:
            row = await cursor.fetchone()
        if not row:
            return None
        return UserResponse(
            id=row["id"],
            clerk_user_id=row["clerk_user_id"],
            name=row["name"],
            email=row["email"],
            avatar_url=row["avatar_url"],
            role=row["role"],
            workspace_id=row["workspace_id"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    async def sync_user(self, ctx: UserContext) -> UserResponse:
        """Upsert user profile from verified Clerk context."""
        existing = await self.get_by_clerk_id(ctx.clerk_user_id)
        now = self._now_iso()

        name = ctx.name or (ctx.email.split("@")[0] if ctx.email else "BrandBrew User")
        email = ctx.email or f"{ctx.clerk_user_id}@brandbrew.internal"

        if existing:
            await self._db.execute(
                """
                UPDATE users
                SET name = ?, email = ?, avatar_url = ?, updated_at = ?
                WHERE clerk_user_id = ?
                """,
                (name, email, ctx.avatar_url or existing.avatar_url, now, ctx.clerk_user_id),
            )
            await self._db.commit()
            return await self.get_by_clerk_id(ctx.clerk_user_id)  # type: ignore

        user_id = self._new_id()
        await self._db.execute(
            """
            INSERT INTO users (id, clerk_user_id, name, email, avatar_url, role, workspace_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                ctx.clerk_user_id,
                name,
                email,
                ctx.avatar_url,
                ctx.role,
                ctx.workspace_id,
                now,
                now,
            ),
        )
        await self._db.commit()
        return UserResponse(
            id=user_id,
            clerk_user_id=ctx.clerk_user_id,
            name=name,
            email=email,
            avatar_url=ctx.avatar_url,
            role=ctx.role,
            workspace_id=ctx.workspace_id,
            created_at=now,
            updated_at=now,
        )
