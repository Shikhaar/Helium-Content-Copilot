"""
StrategistService — orchestrates the full opportunity detection pipeline.

Pipeline:
  1. Load brand, products, posts from repositories
  2. Compute PerformanceSummary via AnalyticsService
  3. Call AI provider for qualitative opportunity signals
  4. Score each opportunity via ScoringService (deterministic math)
  5. Sort by score descending
  6. Persist to OpportunityRepository
  7. Return ranked opportunities + performance summary
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.core.logging_config import get_logger
from app.models.schemas import (
    AnalyzeResponse,
    Opportunity,
)
from app.services.ai.providers import BaseAIProvider
from app.services.analytics import AnalyticsService
from app.services.repositories import (
    BrandRepository,
    OpportunityRepository,
    PostRepository,
    ProductRepository,
)
from app.services.scoring import ScoringService

logger = get_logger(__name__)


class StrategistService:
    """
    Orchestrates the Brand Analysis → Opportunity Detection → Scoring pipeline.
    """

    def __init__(
        self,
        brand_repo: BrandRepository,
        product_repo: ProductRepository,
        post_repo: PostRepository,
        opportunity_repo: OpportunityRepository,
        analytics: AnalyticsService,
        scoring: ScoringService,
        ai_provider: BaseAIProvider,
    ) -> None:
        self._brand_repo = brand_repo
        self._product_repo = product_repo
        self._post_repo = post_repo
        self._opportunity_repo = opportunity_repo
        self._analytics = analytics
        self._scoring = scoring
        self._ai = ai_provider

    async def analyze(self) -> AnalyzeResponse:
        """
        Run the full analysis pipeline and return ranked content opportunities.
        """
        logger.info("Starting brand analysis pipeline...")

        brand = await self._brand_repo.get()
        products = await self._product_repo.list_all()
        posts = await self._post_repo.list_all()

        if not brand or not products or not posts:
            logger.error("Missing required data: brand=%s products=%d posts=%d",
                         bool(brand), len(products), len(posts))
            raise ValueError("Brand, products, and historical posts must be seeded before analysis.")

        logger.info("Loaded: brand='%s' | %d products | %d posts", brand.name, len(products), len(posts))

        # Step 1: Compute deterministic analytics
        logger.info("Step 1: Computing performance analytics...")
        performance = self._analytics.compute_summary(posts)

        # Step 2: Get AI qualitative opportunities
        logger.info("Step 2: Requesting AI content opportunities...")
        raw_response, is_demo = await self._ai.get_opportunities(
            brand, products, posts, performance
        )
        logger.info(
            "AI returned %d opportunities | is_demo=%s",
            len(raw_response.opportunities), is_demo,
        )

        # Step 3: Score each opportunity deterministically
        logger.info("Step 3: Scoring opportunities with deterministic engine...")
        product_map = {p.id: p for p in products}
        scored_opportunities: list[Opportunity] = []

        for raw in raw_response.opportunities:
            product = product_map.get(raw.suggested_product_id)
            if not product:
                logger.warning(
                    "Opportunity '%s' references unknown product_id='%s' — skipping",
                    raw.title, raw.suggested_product_id,
                )
                continue

            breakdown, confidence, confidence_reason = self._scoring.score(
                raw=raw,
                product=product,
                posts=posts,
                all_products=products,
                active_campaign=brand.campaign,
            )

            opp = Opportunity(
                id=str(uuid.uuid4()),
                title=raw.title,
                content_angle=raw.content_angle,
                audience=raw.audience,
                objective=raw.objective,
                platform=raw.platform,
                format=raw.format,
                suggested_product_id=raw.suggested_product_id,
                suggested_product_name=product.name,
                why=raw.why,
                historical_signal=raw.historical_signal,
                product_signal=raw.product_signal,
                audience_signal=raw.audience_signal,
                seasonal_signal=raw.seasonal_signal,
                business_signal=raw.business_signal,
                score=breakdown.total,
                score_breakdown=breakdown,
                confidence=confidence,
                confidence_reason=confidence_reason,
                created_at=datetime.now(timezone.utc).isoformat(),
                is_demo=is_demo,
            )
            scored_opportunities.append(opp)

        # Step 4: Sort by score descending
        scored_opportunities.sort(key=lambda o: o.score, reverse=True)
        logger.info(
            "Scoring complete: top scores = %s",
            [o.score for o in scored_opportunities],
        )

        # Step 5: Persist
        await self._opportunity_repo.save_all(scored_opportunities)
        logger.info("Persisted %d opportunities to database", len(scored_opportunities))

        return AnalyzeResponse(
            opportunities=scored_opportunities,
            performance_summary=performance,
            is_demo=is_demo,
        )
