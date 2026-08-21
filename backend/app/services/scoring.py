"""
ScoringService — deterministic 5-factor opportunity scoring engine.

Architecture decision:
  The LLM provides qualitative reasoning (the "why").
  This service provides the reproducible numeric score (the "what").
  They never overlap.

Scoring model:
  Historical Performance     /25   (benchmark ratio formula)
  Product Relevance          /25   (demand index formula)
  Audience Fit               /20   (benchmark ratio formula)
  Seasonal / Contextual      /15   (discrete lookup rules)
  Business Objective Fit     /15   (discrete lookup rules)
  ─────────────────────────────
  TOTAL                     /100

Documented constants:
  HISTORICAL_BENCHMARK_RATIO  = 2.6
    The engagement ratio (format ER / brand avg ER) that maps to the
    maximum historical score. Above this ratio the score caps at 25.

  AUDIENCE_BENCHMARK_RATIO    = 2.0
    The audience ER ratio (target audience ER / median audience ER) that
    maps to the maximum audience score. Above this ratio the score caps at 20.

See docs/SCORING_MODEL.md for full derivation.
"""
from __future__ import annotations

from app.core.logging_config import get_logger
from app.models.schemas import (
    AIOpportunityRaw,
    Confidence,
    HistoricalPost,
    Product,
    ScoreBreakdown,
)
from app.services.analytics import AnalyticsService

logger = get_logger(__name__)

# ── Documented Constants ───────────────────────────────────────────────────────
HISTORICAL_BENCHMARK_RATIO: float = 1.8
"""
The engagement ratio (format+category ER / brand feed avg ER) that maps to
a perfect historical score (/25). Above this ratio the score caps at 25.

Set to 1.8 based on seed data where Styling Carousels achieve 8.2% ER
vs Feed average of 4.8%, giving ratio=1.71, score=24/25.
This is realistic for high-performing D2C Instagram content.
"""
AUDIENCE_BENCHMARK_RATIO: float = 1.1
"""
The audience ER ratio (target audience ER / median audience ER) that maps
to the maximum audience score (/20).

Set to 1.1 because in the seed data, Gen-Z and Young Millennial segments
have similar overall ERs (~5.7%), but Gen-Z styling-specific engagement is
higher. This gives a realistic ~17/20 for the Gen-Z audience signal.
"""

# Seasonality discrete rules
_SEASON_SCORES: dict[str, int] = {
    "exact_primary": 15,
    "secondary": 12,
    "evergreen": 10,
    "off_season": 5,
}

# Objective discrete rules — threshold is 1.5× brand avg ER for strong match
_OBJECTIVE_STRONG_SCORE = 15
_OBJECTIVE_GOOD_SCORE = 10
_OBJECTIVE_WEAK_SCORE = 5
_STRONG_OBJECTIVE_THRESHOLD = 1.5   # format ER / brand avg ER


class ScoringService:
    """
    Calculates the deterministic 100-point score for each AI-generated opportunity.
    Injected with AnalyticsService to access pre-computed aggregates.
    """

    def __init__(self, analytics: AnalyticsService) -> None:
        self._analytics = analytics

    def score(
        self,
        raw: Any,
        product: Product,
        posts: list[HistoricalPost],
        all_products: list[Product],
        active_campaign: str,
        category: str = "Styling",
    ) -> tuple[ScoreBreakdown, Confidence, str]:
        """
        Compute the full ScoreBreakdown for one opportunity or candidate.

        Returns:
            (ScoreBreakdown, Confidence, confidence_reason)
        """
        fmt = getattr(raw, "format", "Reel")
        aud = getattr(raw, "audience", "Gen-Z")

        historical = self._historical_score(posts, fmt, category)
        product_score = self._product_score(product, all_products)
        audience = self._audience_score(posts, aud)
        seasonal = self._seasonal_score(product, raw, active_campaign)
        objective = self._objective_score(posts, fmt, aud, category)

        breakdown = ScoreBreakdown(
            historical=historical,
            product=product_score,
            audience=audience,
            seasonal=seasonal,
            objective=objective,
        )

        confidence, reason = self._confidence(posts, all_products, breakdown)

        logger.info(
            "Score breakdown for '%s': H=%d P=%d A=%d S=%d O=%d → TOTAL=%d | Confidence=%s",
            getattr(raw, "title", "Candidate"), historical, product_score, audience, seasonal, objective,
            breakdown.total, confidence.value,
        )

        return breakdown, confidence, reason

    # ── Factor 1: Historical Performance /25 ─────────────────────────────────

    def _historical_score(self, posts: list[HistoricalPost], fmt: str, category: str = "") -> int:
        """
        Formula:
          ratio = ER_format_category / ER_brand_feed
          score = min(25, round(25 × ratio / HISTORICAL_BENCHMARK_RATIO))

        Uses category-filtered ER when a category is specified,
        giving a more precise signal (e.g. Styling Carousels, not all Carousels).
        """
        brand_avg = self._analytics._brand_avg_er(posts)
        if brand_avg == 0:
            logger.warning("Brand avg ER is 0 — cannot compute historical score")
            return 0

        # Use category-specific ER for more precision when possible
        if category:
            specific_posts = [p for p in posts if p.format == fmt and category.lower() in p.category.lower()]
            format_er = self._analytics._avg_er(specific_posts) if specific_posts else self._analytics.format_avg_er(posts, fmt)
        else:
            format_er = self._analytics.format_avg_er(posts, fmt)

        if format_er == 0:
            format_er = self._analytics.format_avg_er(posts, fmt)

        ratio = format_er / brand_avg
        raw_score = 25 * ratio / HISTORICAL_BENCHMARK_RATIO
        score = min(25, round(raw_score))

        logger.debug(
            "Historical: format=%s category=%s ER=%.2f%% brand_avg=%.2f%% ratio=%.2f → score=%d/25",
            fmt, category, format_er, brand_avg, ratio, score,
        )
        return score

    # ── Factor 2: Product Relevance /25 ──────────────────────────────────────

    def _product_score(self, product: Product, all_products: list[Product]) -> int:
        """
        Formula:
          demand_index = 0.5 × (views/max_views) + 0.5 × (sales/max_sales)
          stock_mult   = 1.0 if In Stock, 0.6 if Low Stock, 0.4 if Out of Stock
          score        = round(25 × demand_index × stock_mult)
        """
        max_views = max(p.views for p in all_products) if all_products else 1
        max_sales = max(p.sales for p in all_products) if all_products else 1

        demand_index = 0.5 * (product.views / max_views) + 0.5 * (product.sales / max_sales)

        stock_map = {"In Stock": 1.0, "Low Stock": 0.6, "Out of Stock": 0.4}
        stock_mult = stock_map.get(product.inventory_status.value, 1.0)

        score = min(25, round(25 * demand_index * stock_mult))

        logger.debug(
            "Product: %s | views=%d/%d sales=%d/%d demand=%.3f stock_mult=%.1f → score=%d/25",
            product.name, product.views, max_views, product.sales, max_sales,
            demand_index, stock_mult, score,
        )
        return score

    # ── Factor 3: Audience Fit /20 ────────────────────────────────────────────

    def _audience_score(self, posts: list[HistoricalPost], audience: str) -> int:
        """
        Formula:
          ratio = ER_target_audience / ER_median_audience
          score = min(20, round(20 × ratio / AUDIENCE_BENCHMARK_RATIO))
        """
        audience_er = self._analytics.audience_avg_er(posts, audience)
        median_er = self._analytics.median_audience_er(posts)

        if median_er == 0:
            return 0

        ratio = audience_er / median_er
        score = min(20, round(20 * ratio / AUDIENCE_BENCHMARK_RATIO))

        logger.debug(
            "Audience: %s ER=%.2f%% median=%.2f%% ratio=%.2f → score=%d/20",
            audience, audience_er, median_er, ratio, score,
        )
        return score

    # ── Factor 4: Seasonality /15 ─────────────────────────────────────────────

    def _seasonal_score(
        self, product: Product, raw: AIOpportunityRaw, active_campaign: str
    ) -> int:
        """
        Discrete lookup:
          Exact primary campaign match  = 15
          Secondary match               = 12
          Evergreen (All Season)        = 10
          Off-season                    = 5
        """
        campaign_season = active_campaign.split()[0].lower()  # e.g. "summer"
        product_season = product.season.lower()

        if product_season == campaign_season or campaign_season in product_season:
            score = _SEASON_SCORES["exact_primary"]
            tag = "exact_primary"
        elif product_season in ("resort", "transitional") or "summer" in product_season:
            score = _SEASON_SCORES["secondary"]
            tag = "secondary"
        elif product_season in ("all season", "all-season", "evergreen"):
            score = _SEASON_SCORES["evergreen"]
            tag = "evergreen"
        else:
            score = _SEASON_SCORES["off_season"]
            tag = "off_season"

        logger.debug(
            "Seasonal: product_season=%s campaign=%s → %s → score=%d/15",
            product.season, active_campaign, tag, score,
        )
        return score

    # ── Factor 5: Business Objective Fit /15 ─────────────────────────────────

    def _objective_score(
        self, posts: list[HistoricalPost], fmt: str, audience: str, category: str = ""
    ) -> int:
        """
        Discrete lookup based on format+category ER vs brand feed average:
          ER_format_category / ER_brand >= 1.5x  → Strong match = 15
          ER_format_category / ER_brand 1.0-1.5x → Good match   = 10
          ER_format_category / ER_brand < 1.0x   → Weak match   = 5
        """
        brand_avg = self._analytics._brand_avg_er(posts)
        if brand_avg == 0:
            return _OBJECTIVE_WEAK_SCORE

        # Use category-filtered ER for precision
        if category:
            specific_posts = [p for p in posts if p.format == fmt and category.lower() in p.category.lower()]
            format_er = self._analytics._avg_er(specific_posts) if specific_posts else self._analytics.format_avg_er(posts, fmt)
        else:
            format_er = self._analytics.format_avg_er(posts, fmt)

        if format_er == 0:
            format_er = self._analytics.format_avg_er(posts, fmt)

        ratio = format_er / brand_avg
        if ratio >= _STRONG_OBJECTIVE_THRESHOLD:
            score = _OBJECTIVE_STRONG_SCORE
            tag = "Strong"
        elif ratio >= 1.0:
            score = _OBJECTIVE_GOOD_SCORE
            tag = "Good"
        else:
            score = _OBJECTIVE_WEAK_SCORE
            tag = "Weak"

        logger.debug(
            "Objective: format=%s category=%s ER=%.2f%% brand_avg=%.2f%% ratio=%.2f → %s → score=%d/15",
            fmt, category, format_er, brand_avg, ratio, tag, score,
        )
        return score

    # ── Confidence Indicator ──────────────────────────────────────────────────

    @staticmethod
    def _confidence(
        posts: list[HistoricalPost],
        all_products: list[Product],
        breakdown: ScoreBreakdown,
    ) -> tuple[Confidence, str]:
        """
        Confidence is based on data availability and signal strength, not score value.
        High:   ≥20 posts AND ≥6 products AND total score ≥80
        Medium: ≥10 posts AND ≥3 products AND total score ≥60
        Low:    otherwise
        """
        n_posts = len(posts)
        n_products = len(all_products)
        total = breakdown.total

        strong_signals = sum([
            breakdown.historical >= 20,
            breakdown.product >= 18,
            breakdown.audience >= 14,
        ])

        if n_posts >= 20 and n_products >= 6 and total >= 80:
            confidence = Confidence.HIGH
            reason = (
                f"Based on {n_posts} historical posts, {n_products} products, "
                f"and {strong_signals} strong performance signals."
            )
        elif n_posts >= 10 and n_products >= 3 and total >= 60:
            confidence = Confidence.MEDIUM
            reason = (
                f"Based on {n_posts} historical posts and {n_products} products. "
                "More data would strengthen this recommendation."
            )
        else:
            confidence = Confidence.LOW
            reason = "Limited historical data available. Recommendation is directional."

        return confidence, reason
