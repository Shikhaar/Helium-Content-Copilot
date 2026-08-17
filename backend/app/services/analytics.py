"""
AnalyticsService — deterministic calculation of all engagement metrics.

Responsibilities:
  - Compute per-post engagement rate (no LLM involvement)
  - Aggregate brand-level averages by format, audience, and category
  - Provide PerformanceSummary for the API and ScoringService

All calculations are pure Python arithmetic. The LLM never touches these numbers.
"""
from __future__ import annotations

from app.core.logging_config import get_logger
from app.models.schemas import (
    AudiencePerformance,
    FormatPerformance,
    HistoricalPost,
    PerformanceSummary,
)

logger = get_logger(__name__)


class AnalyticsService:
    """Computes deterministic engagement analytics from historical post data."""

    # ── Public API ────────────────────────────────────────────────────────────

    def compute_summary(self, posts: list[HistoricalPost]) -> PerformanceSummary:
        """Return a full PerformanceSummary from a list of historical posts."""
        if not posts:
            logger.warning("AnalyticsService.compute_summary called with empty post list")
            return self._empty_summary()

        logger.info("Computing analytics summary over %d posts", len(posts))

        brand_avg = self._brand_avg_er(posts)
        by_format = self._by_format(posts)
        by_audience = self._by_audience(posts)

        top_format = max(by_format, key=lambda x: x.avg_engagement_rate).format
        top_audience = max(by_audience, key=lambda x: x.avg_engagement_rate).audience

        logger.info(
            "Analytics: brand_avg=%.2f%% | top_format=%s (%.2f%%) | top_audience=%s (%.2f%%)",
            brand_avg,
            top_format,
            max(by_format, key=lambda x: x.avg_engagement_rate).avg_engagement_rate,
            top_audience,
            max(by_audience, key=lambda x: x.avg_engagement_rate).avg_engagement_rate,
        )

        return PerformanceSummary(
            brand_avg_engagement_rate=brand_avg,
            total_posts=len(posts),
            by_format=by_format,
            by_audience=by_audience,
            top_performing_format=top_format,
            top_performing_audience=top_audience,
        )

    def format_avg_er(self, posts: list[HistoricalPost], fmt: str) -> float:
        """Average ER for a specific format (e.g. 'Carousel', 'Reel')."""
        matching = [p for p in posts if p.format == fmt]
        return self._avg_er(matching)

    def audience_avg_er(self, posts: list[HistoricalPost], audience: str) -> float:
        """Average ER for a specific audience segment."""
        matching = [p for p in posts if p.audience == audience]
        return self._avg_er(matching)

    def median_audience_er(self, posts: list[HistoricalPost]) -> float:
        """Median engagement rate across all distinct audience segments."""
        audience_ers = [
            self.audience_avg_er(posts, a)
            for a in {p.audience for p in posts}
        ]
        if not audience_ers:
            return 0.0
        sorted_ers = sorted(audience_ers)
        mid = len(sorted_ers) // 2
        if len(sorted_ers) % 2 == 0:
            return round((sorted_ers[mid - 1] + sorted_ers[mid]) / 2, 2)
        return round(sorted_ers[mid], 2)

    def category_avg_er(self, posts: list[HistoricalPost], category: str) -> float:
        """Average ER for a specific content category (e.g. 'Styling', 'Education')."""
        matching = [p for p in posts if p.category == category]
        return self._avg_er(matching)

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _engagement_rate(post: HistoricalPost) -> float:
        """
        Engagement Rate = (likes + comments + shares + saves) / impressions × 100
        """
        if post.impressions == 0:
            return 0.0
        return (post.likes + post.comments + post.shares + post.saves) / post.impressions * 100

    def _avg_er(self, posts: list[HistoricalPost]) -> float:
        if not posts:
            return 0.0
        total = sum(self._engagement_rate(p) for p in posts)
        return round(total / len(posts), 2)

    def _brand_avg_er(self, posts: list[HistoricalPost]) -> float:
        """
        Brand baseline ER computed from feed content only (Carousel + Static Post).
        Reels are excluded because they have algorithmic reach that inflates the
        baseline and makes format-vs-baseline comparisons misleading.
        This matches how real social media managers compute their 'content average'.
        """
        feed_posts = [p for p in posts if p.format != "Reel"]
        return self._avg_er(feed_posts) if feed_posts else self._avg_er(posts)

    def _by_format(self, posts: list[HistoricalPost]) -> list[FormatPerformance]:
        formats = {p.format for p in posts}
        result = []
        for fmt in sorted(formats):
            matching = [p for p in posts if p.format == fmt]
            result.append(
                FormatPerformance(
                    format=fmt,
                    avg_engagement_rate=self._avg_er(matching),
                    post_count=len(matching),
                )
            )
        return sorted(result, key=lambda x: x.avg_engagement_rate, reverse=True)

    def _by_audience(self, posts: list[HistoricalPost]) -> list[AudiencePerformance]:
        audiences = {p.audience for p in posts}
        result = []
        for aud in sorted(audiences):
            matching = [p for p in posts if p.audience == aud]
            result.append(
                AudiencePerformance(
                    audience=aud,
                    avg_engagement_rate=self._avg_er(matching),
                    post_count=len(matching),
                )
            )
        return sorted(result, key=lambda x: x.avg_engagement_rate, reverse=True)

    @staticmethod
    def _empty_summary() -> PerformanceSummary:
        return PerformanceSummary(
            brand_avg_engagement_rate=0.0,
            total_posts=0,
            by_format=[],
            by_audience=[],
            top_performing_format="N/A",
            top_performing_audience="N/A",
        )
