"""
CandidateGenerationService — Stage 1 of the recommendation pipeline.

Generates a bounded set of plausible candidate opportunity seeds by combining:
  - Products in catalog (with inventory, category, sales velocity signals)
  - Winning formats from historical analytics (Reels, Carousels, Static)
  - Target audience segments (Gen-Z, Urban Millennial, etc.)
  - Active campaign context (e.g. Summer 2026)
  - Business objectives (Product Discovery, Engagement, Education, Conversion)

Candidate opportunities are UNSCORED.
The final 0–100 numeric score is calculated strictly by ScoringService (Stage 2).
"""
from __future__ import annotations

from app.core.logging_config import get_logger
from app.models.schemas import (
    Brand,
    CandidateOpportunity,
    InventoryStatus,
    PerformanceSummary,
    Platform,
    PostFormat,
    Product,
)

logger = get_logger(__name__)


class CandidateGenerationService:
    """
    Generates plausible content opportunity candidates from structured brand data.
    """

    def generate_candidates(
        self,
        brand: Brand,
        products: list[Product],
        performance: PerformanceSummary,
        max_candidates: int = 15,
    ) -> list[CandidateOpportunity]:
        """
        Generate a bounded list of candidate opportunity seeds.
        
        Applies heuristic pre-filtering:
          - Prioritizes in-stock products with active demand (views/sales)
          - Prioritizes formats that exceed or match brand average engagement rate
          - Aligns product season with active campaign context
        """
        logger.info(
            "Generating candidate opportunities for brand='%s' | %d products available",
            brand.name,
            len(products),
        )

        candidates: list[CandidateOpportunity] = []
        top_format = performance.top_performing_format or PostFormat.REEL.value
        top_audience = performance.top_performing_audience or "Gen-Z"

        # Determine active formats sorted by engagement performance
        formats = [f.format for f in performance.by_format if f.post_count > 0]
        if not formats:
            formats = [PostFormat.REEL.value, PostFormat.CAROUSEL.value]
        elif PostFormat.REEL.value not in formats:
            formats.append(PostFormat.REEL.value)

        # Strategic objectives mapping
        objectives_map = {
            PostFormat.REEL.value: ["Product Discovery", "Engagement + Product Discovery", "AWARENESS"],
            PostFormat.CAROUSEL.value: ["Education + Engagement", "Product Discovery", "Styling Guide"],
            PostFormat.STATIC.value: ["Brand Announcement", "Editorial Highlight"],
        }

        # Filter in-stock or high-demand products first
        active_products = [p for p in products if p.inventory_status != InventoryStatus.OUT_OF_STOCK]
        if not active_products:
            active_products = products  # Fallback if catalog is sparse

        for product in active_products:
            # 1. Primary candidate: Top performing format + Target Audience
            primary_format = top_format
            primary_obj = (
                "Product Discovery"
                if product.sales < 100
                else "Engagement + Product Discovery"
            )
            candidates.append(
                CandidateOpportunity(
                    product_id=product.id,
                    product_name=product.name,
                    format=primary_format,
                    platform=Platform.INSTAGRAM.value,
                    audience=product.target_audience or top_audience,
                    objective=primary_obj,
                    campaign=brand.campaign,
                    category=product.category,
                    inventory_status=product.inventory_status.value
                    if hasattr(product.inventory_status, "value")
                    else str(product.inventory_status),
                )
            )

            # 2. Secondary candidate: Educational / Styling Carousel for multi-feature products
            if len(product.features) >= 2 or product.price_inr >= 1500:
                candidates.append(
                    CandidateOpportunity(
                        product_id=product.id,
                        product_name=product.name,
                        format=PostFormat.CAROUSEL.value,
                        platform=Platform.INSTAGRAM.value,
                        audience="Urban Millennial",
                        objective="Education + Engagement",
                        campaign=brand.campaign,
                        category=product.category,
                        inventory_status=product.inventory_status.value
                        if hasattr(product.inventory_status, "value")
                        else str(product.inventory_status),
                    )
                )

            # 3. Seasonal drop candidate if product matches brand campaign
            if brand.campaign.lower().split()[0] in product.season.lower() or "all" in product.season.lower():
                candidates.append(
                    CandidateOpportunity(
                        product_id=product.id,
                        product_name=product.name,
                        format=PostFormat.REEL.value,
                        platform=Platform.INSTAGRAM.value,
                        audience="Gen-Z",
                        objective="Product Discovery",
                        campaign=brand.campaign,
                        category=product.category,
                        inventory_status=product.inventory_status.value
                        if hasattr(product.inventory_status, "value")
                        else str(product.inventory_status),
                    )
                )

        # Deduplicate candidates by (product_id, format, audience, objective)
        seen: set[tuple[str, str, str, str]] = set()
        unique_candidates: list[CandidateOpportunity] = []
        for c in candidates:
            key = (c.product_id, c.format, c.audience, c.objective)
            if key not in seen:
                seen.add(key)
                unique_candidates.append(c)

        logger.info(
            "Candidate generation complete: %d bounded candidates produced",
            len(unique_candidates[:max_candidates]),
        )
        return unique_candidates[:max_candidates]
