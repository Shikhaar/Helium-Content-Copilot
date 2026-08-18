"""
ContentGeneratorService — orchestrates AI content creation + persistence.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.core.logging_config import get_logger
from app.models.schemas import (
    CalendarEntry,
    ContentDraft,
    ContentStatus,
    GenerateContentRequest,
    ScheduleRequest,
    UpdateDraftRequest,
)
from app.services.ai.providers import BaseAIProvider
from app.services.repositories import (
    BrandRepository,
    CalendarRepository,
    ContentRepository,
    OpportunityRepository,
    ProductRepository,
)

logger = get_logger(__name__)


class ContentGeneratorService:
    """Manages content generation, editing, approval, and scheduling."""

    def __init__(
        self,
        brand_repo: BrandRepository,
        product_repo: ProductRepository,
        opportunity_repo: OpportunityRepository,
        content_repo: ContentRepository,
        calendar_repo: CalendarRepository,
        ai_provider: BaseAIProvider,
    ) -> None:
        self._brand_repo = brand_repo
        self._product_repo = product_repo
        self._opportunity_repo = opportunity_repo
        self._content_repo = content_repo
        self._calendar_repo = calendar_repo
        self._ai = ai_provider

    async def generate(self, request: GenerateContentRequest) -> ContentDraft:
        """Generate platform-specific content for the selected opportunity."""
        logger.info(
            "Generating content | opportunity_id=%s | platform=%s | format=%s",
            request.opportunity_id, request.platform.value, request.format.value,
        )

        opportunity = await self._opportunity_repo.get_by_id(request.opportunity_id)
        if not opportunity:
            raise ValueError(f"Opportunity not found: {request.opportunity_id}")

        product = await self._product_repo.get_by_id(opportunity.suggested_product_id)
        if not product:
            raise ValueError(f"Product not found: {opportunity.suggested_product_id}")

        brand = await self._brand_repo.get()
        if not brand:
            raise ValueError("Brand not seeded")

        raw_content, is_demo = await self._ai.generate_content(
            opportunity=opportunity,
            product=product,
            request=request,
            brand=brand,
        )
        logger.info("Content generated | is_demo=%s | slides=%d", is_demo, len(raw_content.slides))

        now = datetime.now(timezone.utc).isoformat()
        draft = ContentDraft(
            id=str(uuid.uuid4()),
            opportunity_id=request.opportunity_id,
            platform=request.platform.value,
            format=request.format.value,
            audience=request.audience,
            objective=request.objective,
            slides=raw_content.slides,
            caption=raw_content.caption,
            cta=raw_content.cta,
            hashtags=raw_content.hashtags,
            status=ContentStatus.DRAFT,
            scheduled_date=None,
            scheduled_time=None,
            created_at=now,
            updated_at=now,
            is_demo=is_demo,
        )

        await self._content_repo.create(draft)
        return draft

    async def update(self, draft_id: str, updates: UpdateDraftRequest) -> ContentDraft:
        """Apply human edits to a draft."""
        logger.info("Updating draft | id=%s", draft_id)
        draft = await self._content_repo.get_by_id(draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        if updates.slides is not None:
            draft = draft.model_copy(update={"slides": updates.slides})
        if updates.caption is not None:
            draft = draft.model_copy(update={"caption": updates.caption})
        if updates.cta is not None:
            draft = draft.model_copy(update={"cta": updates.cta})
        if updates.hashtags is not None:
            draft = draft.model_copy(update={"hashtags": updates.hashtags})

        return await self._content_repo.update(draft)

    async def approve(self, draft_id: str) -> ContentDraft:
        """Mark content as approved — human has reviewed and signed off."""
        logger.info("Approving draft | id=%s", draft_id)
        draft = await self._content_repo.get_by_id(draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        draft = draft.model_copy(update={"status": ContentStatus.APPROVED})
        return await self._content_repo.update(draft)

    async def schedule(self, draft_id: str, schedule: ScheduleRequest) -> ContentDraft:
        """Schedule an approved draft and add it to the calendar."""
        logger.info(
            "Scheduling draft | id=%s | date=%s | time=%s",
            draft_id, schedule.scheduled_date, schedule.scheduled_time,
        )

        draft = await self._content_repo.get_by_id(draft_id)
        if not draft:
            raise ValueError(f"Draft not found: {draft_id}")

        if draft.status not in (ContentStatus.APPROVED, ContentStatus.DRAFT):
            raise ValueError(f"Draft status '{draft.status}' cannot be scheduled")

        opportunity = await self._opportunity_repo.get_by_id(draft.opportunity_id)
        title = opportunity.title if opportunity else "Scheduled Post"

        draft = draft.model_copy(update={
            "status": ContentStatus.SCHEDULED,
            "scheduled_date": schedule.scheduled_date,
            "scheduled_time": schedule.scheduled_time,
        })
        await self._content_repo.update(draft)

        calendar_entry = CalendarEntry(
            id=str(uuid.uuid4()),
            draft_id=draft.id,
            title=title,
            platform=draft.platform,
            format=draft.format,
            status=ContentStatus.SCHEDULED,
            scheduled_datetime=f"{schedule.scheduled_date}T{schedule.scheduled_time}:00",
        )
        await self._calendar_repo.upsert(calendar_entry)
        logger.info("Calendar entry created for draft %s", draft_id)

        return draft
