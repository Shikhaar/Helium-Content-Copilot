"""
StrategistService — orchestrates the full 2-stage opportunity detection pipeline.

Pipeline:
  1. Load brand, products, and posts scoped by `brand_id`.
  2. Compute deterministic PerformanceSummary via AnalyticsService.
  3. Generate candidate opportunity seeds via CandidateGenerationService (Stage 1).
  4. Score candidates deterministically via ScoringService (Stage 2).
  5. Enrich top-scored candidates with AI Strategist rationale & creative angles.
  6. Persist ranked opportunities to OpportunityRepository for instant database reads.
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
from app.services.candidate_generator import CandidateGenerationService
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
    Orchestrates the Analytics → Candidate Generation → Scoring → AI Enrichment pipeline.
    """

    def __init__(
        self,
        brand_repo: BrandRepository,
        product_repo: ProductRepository,
        post_repo: PostRepository,
        opportunity_repo: OpportunityRepository,
        analytics: AnalyticsService,
        candidate_generator: CandidateGenerationService,
        scoring: ScoringService,
        ai_provider: BaseAIProvider,
    ) -> None:
        self._brand_repo = brand_repo
        self._product_repo = product_repo
        self._post_repo = post_repo
        self._opportunity_repo = opportunity_repo
        self._analytics = analytics
        self._candidate_generator = candidate_generator
        self._scoring = scoring
        self._ai = ai_provider

    async def analyze(self, brand_id: str = "snitch") -> AnalyzeResponse:
        """
        Run the 2-stage opportunity generation pipeline and persist ranked recommendations.
        """
        logger.info("Starting brand analysis pipeline for brand_id='%s'...", brand_id)

        brand = await self._brand_repo.get_by_id(brand_id)
        if not brand:
            brand = await self._brand_repo.get()

        if not brand:
            logger.error("Brand '%s' not found.", brand_id)
            raise ValueError(f"Brand '{brand_id}' not found in database.")

        products = await self._product_repo.list_all(brand_id=brand.id)
        posts = await self._post_repo.list_all(brand_id=brand.id)

        if not products or not posts:
            logger.error("Missing required data for brand='%s': %d products | %d posts",
                         brand.name, len(products), len(posts))
            raise ValueError(f"Brand '{brand.name}' must have seeded products and historical posts before analysis.")

        logger.info("Loaded for brand '%s': %d products | %d historical posts", brand.name, len(products), len(posts))

        # Step 1: Compute deterministic analytics rollups
        logger.info("Step 1: Computing performance analytics...")
        performance = self._analytics.compute_summary(posts)

        # Step 2: Generate candidate seeds (Stage 1 of recommendation engine)
        logger.info("Step 2: Generating candidate opportunity seeds...")
        candidates = self._candidate_generator.generate_candidates(brand, products, performance)
        logger.info("Candidate generation produced %d candidate combinations", len(candidates))

        # Step 3: Get AI qualitative reasoning & creative angles
        logger.info("Step 3: Requesting AI strategist qualitative signals...")
        raw_response, is_demo = await self._ai.get_opportunities(
            brand, products, posts, performance
        )
        logger.info(
            "AI returned %d strategic angles | is_demo=%s",
            len(raw_response.opportunities), is_demo,
        )

        # Step 4: Deterministic Scoring (Stage 2 of recommendation engine)
        logger.info("Step 4: Scoring opportunities with deterministic mathematical engine...")
        product_map = {p.id: p for p in products}
        scored_opportunities: list[Opportunity] = []
        analysis_run_id = f"run_{uuid.uuid4().hex[:8]}"

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
                brand_id=brand.id,
                analysis_run_id=analysis_run_id,
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

        # Step 5: Sort by score descending and take up to top 5 opportunities
        scored_opportunities.sort(key=lambda o: o.score, reverse=True)
        scored_opportunities = scored_opportunities[:5]
        logger.info(
            "Scoring complete: ranked %d opportunities | top score = %s",
            len(scored_opportunities),
            scored_opportunities[0].score if scored_opportunities else "N/A",
        )


        # Step 6: Persist exactly 5 opportunities for instant database reads on subsequent dashboard views
        await self._opportunity_repo.save_all(
            scored_opportunities,
            brand_id=brand.id,
            analysis_run_id=analysis_run_id,
        )
        logger.info("Persisted %d opportunities for brand='%s' to database", len(scored_opportunities), brand.id)


        return AnalyzeResponse(
            opportunities=scored_opportunities,
            performance_summary=performance,
            is_demo=is_demo,
        )

