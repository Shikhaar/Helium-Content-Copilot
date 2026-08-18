"""
Repository layer — clean, typed access to SQLite tables.

Pattern:
  BaseRepository[T]  →  concrete repos per entity.

Each repository receives a live aiosqlite.Connection (injected per request)
so transactions and connection lifetimes stay under FastAPI's control.
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
    """Access to the brand guidelines and profile record."""

    async def get(self) -> Brand | None:
        logger.debug("BrandRepository.get()")
        async with self._db.execute("SELECT * FROM brand LIMIT 1") as cursor:
            row = await cursor.fetchone()
        if row is None:
            return None
        return Brand(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            tone=json.loads(row["tone"]),
            audience=BrandAudience(**json.loads(row["audience"])),
            campaign=row["campaign"],
        )

    async def update(self, brand: Brand) -> Brand:
        logger.info("Updating brand id=%s campaign='%s'", brand.id, brand.campaign)
        await self._db.execute(
            """UPDATE brand SET
                name=:name, description=:description, tone=:tone,
                audience=:audience, campaign=:campaign
            WHERE id=:id""",
            {
                "id": brand.id,
                "name": brand.name,
                "description": brand.description,
                "tone": json.dumps(brand.tone),
                "audience": json.dumps(brand.audience.model_dump()),
                "campaign": brand.campaign,
            },
        )
        await self._db.commit()
        return brand


# ──────────────────────────────────────────────────────────────────────────────
# Product Repository
# ──────────────────────────────────────────────────────────────────────────────

class ProductRepository(BaseRepository[Product]):
    async def list_all(self) -> list[Product]:
        logger.debug("ProductRepository.list_all()")
        async with self._db.execute("SELECT * FROM products ORDER BY views DESC") as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_product(r) for r in rows]

    async def get_by_id(self, product_id: str) -> Product | None:
        async with self._db.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ) as cursor:
            row = await cursor.fetchone()
        return self._row_to_product(row) if row else None

    async def create(self, product: Product) -> Product:
        logger.info("Creating product id=%s name='%s'", product.id, product.name)
        await self._db.execute(
            """INSERT INTO products (
                id, name, category, price_inr, description, features,
                season, target_audience, inventory_status, views, sales
            ) VALUES (
                :id, :name, :category, :price_inr, :description, :features,
                :season, :target_audience, :inventory_status, :views, :sales
            )""",
            {
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "price_inr": product.price_inr,
                "description": product.description,
                "features": json.dumps(product.features),
                "season": product.season,
                "target_audience": product.target_audience,
                "inventory_status": product.inventory_status.value,
                "views": product.views,
                "sales": product.sales,
            },
        )
        await self._db.commit()
        return product

    async def delete(self, product_id: str) -> None:
        logger.info("Deleting product id=%s", product_id)
        await self._db.execute("DELETE FROM products WHERE id = ?", (product_id,))
        await self._db.commit()

    @staticmethod
    def _row_to_product(row: aiosqlite.Row) -> Product:
        return Product(
            id=row["id"],
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
    async def list_all(self) -> list[HistoricalPost]:
        logger.debug("PostRepository.list_all()")
        async with self._db.execute(
            "SELECT * FROM historical_posts ORDER BY posted_date DESC"
        ) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_post(r) for r in rows]

    @staticmethod
    def _row_to_post(row: aiosqlite.Row) -> HistoricalPost:
        return HistoricalPost(
            id=row["id"],
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
    async def save_all(self, opportunities: list[Opportunity]) -> None:
        logger.info("Saving %d opportunities to DB", len(opportunities))
        await self._db.execute("DELETE FROM opportunities")
        for opp in opportunities:
            await self._db.execute(
                """INSERT INTO opportunities VALUES (
                    :id,:title,:content_angle,:audience,:objective,:platform,
                    :format,:suggested_product_id,:why,:historical_signal,
                    :product_signal,:audience_signal,:seasonal_signal,
                    :business_signal,:score,:score_breakdown,:confidence,
                    :confidence_reason,:created_at,:is_demo
                )""",
                {
                    "id": opp.id,
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
                    "confidence": opp.confidence.value,
                    "confidence_reason": opp.confidence_reason,
                    "created_at": opp.created_at,
                    "is_demo": int(opp.is_demo),
                },
            )
        await self._db.commit()

    async def list_all(self) -> list[Opportunity]:
        async with self._db.execute(
            "SELECT * FROM opportunities ORDER BY score DESC"
        ) as cursor:
            rows = await cursor.fetchall()
        return [self._row_to_opportunity(r) for r in rows]

    async def get_by_id(self, opportunity_id: str) -> Opportunity | None:
        async with self._db.execute(
            "SELECT * FROM opportunities WHERE id = ?", (opportunity_id,)
        ) as cursor:
            row = await cursor.fetchone()
        return self._row_to_opportunity(row) if row else None

    @staticmethod
    def _row_to_opportunity(row: aiosqlite.Row) -> Opportunity:
        breakdown_data = json.loads(row["score_breakdown"])
        return Opportunity(
            id=row["id"],
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
            score_breakdown=ScoreBreakdown(**breakdown_data),
            confidence=Confidence(row["confidence"]),
            confidence_reason=row["confidence_reason"],
            created_at=row["created_at"],
            is_demo=bool(row["is_demo"]),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Content Draft Repository
# ──────────────────────────────────────────────────────────────────────────────

class ContentRepository(BaseRepository[ContentDraft]):
    async def create(self, draft: ContentDraft) -> ContentDraft:
        logger.info("Creating content draft id=%s status=%s", draft.id, draft.status)
        await self._db.execute(
            """INSERT INTO content_drafts VALUES (
                :id,:opportunity_id,:platform,:format,:audience,:objective,
                :slides,:caption,:cta,:hashtags,:status,
                :scheduled_date,:scheduled_time,:created_at,:updated_at,:is_demo
            )""",
            {
                "id": draft.id,
                "opportunity_id": draft.opportunity_id,
                "platform": draft.platform,
                "format": draft.format,
                "audience": draft.audience,
                "objective": draft.objective,
                "slides": json.dumps([s.model_dump() for s in draft.slides]),
                "caption": draft.caption,
                "cta": draft.cta,
                "hashtags": json.dumps(draft.hashtags),
                "status": draft.status.value,
                "scheduled_date": draft.scheduled_date,
                "scheduled_time": draft.scheduled_time,
                "created_at": draft.created_at,
                "updated_at": draft.updated_at,
                "is_demo": int(draft.is_demo),
            },
        )
        await self._db.commit()
        return draft

    async def get_by_id(self, draft_id: str) -> ContentDraft | None:
        async with self._db.execute(
            "SELECT * FROM content_drafts WHERE id = ?", (draft_id,)
        ) as cursor:
            row = await cursor.fetchone()
        return self._row_to_draft(row) if row else None

    async def update(self, draft: ContentDraft) -> ContentDraft:
        logger.info("Updating draft id=%s status=%s", draft.id, draft.status)
        await self._db.execute(
            """UPDATE content_drafts SET
                slides=:slides, caption=:caption, cta=:cta,
                hashtags=:hashtags, status=:status,
                scheduled_date=:scheduled_date, scheduled_time=:scheduled_time,
                updated_at=:updated_at
            WHERE id=:id""",
            {
                "id": draft.id,
                "slides": json.dumps([s.model_dump() for s in draft.slides]),
                "caption": draft.caption,
                "cta": draft.cta,
                "hashtags": json.dumps(draft.hashtags),
                "status": draft.status.value,
                "scheduled_date": draft.scheduled_date,
                "scheduled_time": draft.scheduled_time,
                "updated_at": self._now_iso(),
            },
        )
        await self._db.commit()
        return draft

    @staticmethod
    def _row_to_draft(row: aiosqlite.Row) -> ContentDraft:
        return ContentDraft(
            id=row["id"],
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


# ──────────────────────────────────────────────────────────────────────────────
# Calendar Repository
# ──────────────────────────────────────────────────────────────────────────────

class CalendarRepository(BaseRepository[CalendarEntry]):
    async def upsert(self, entry: CalendarEntry) -> None:
        logger.info("Upserting calendar entry id=%s", entry.id)
        await self._db.execute(
            """INSERT OR REPLACE INTO calendar_entries VALUES (
                :id,:draft_id,:title,:platform,:format,:status,:scheduled_datetime
            )""",
            {
                "id": entry.id,
                "draft_id": entry.draft_id,
                "title": entry.title,
                "platform": entry.platform,
                "format": entry.format,
                "status": entry.status.value,
                "scheduled_datetime": entry.scheduled_datetime,
            },
        )
        await self._db.commit()

    async def list_all(self) -> list[CalendarEntry]:
        async with self._db.execute(
            "SELECT * FROM calendar_entries ORDER BY scheduled_datetime ASC"
        ) as cursor:
            rows = await cursor.fetchall()
        return [
            CalendarEntry(
                id=r["id"],
                draft_id=r["draft_id"],
                title=r["title"],
                platform=r["platform"],
                format=r["format"],
                status=ContentStatus(r["status"]),
                scheduled_datetime=r["scheduled_datetime"],
            )
            for r in rows
        ]

    async def get_by_id(self, entry_id: str) -> CalendarEntry | None:
        async with self._db.execute(
            "SELECT * FROM calendar_entries WHERE id = ?", (entry_id,)
        ) as cursor:
            row = await cursor.fetchone()
        if not row:
            return None
        return CalendarEntry(
            id=row["id"],
            draft_id=row["draft_id"],
            title=row["title"],
            platform=row["platform"],
            format=row["format"],
            status=ContentStatus(row["status"]),
            scheduled_datetime=row["scheduled_datetime"],
        )

    async def delete(self, entry_id: str) -> None:
        logger.info("Deleting calendar entry id=%s", entry_id)
        await self._db.execute("DELETE FROM calendar_entries WHERE id = ?", (entry_id,))
        await self._db.commit()
