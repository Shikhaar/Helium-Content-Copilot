"""
Tests for deterministic engagement rate calculations.

These tests verify that AnalyticsService computes correct ER values
independently of any LLM or external service.
"""
import pytest
from app.models.schemas import HistoricalPost
from app.services.analytics import AnalyticsService


def make_post(
    post_id: str,
    fmt: str = "Carousel",
    audience: str = "Gen-Z",
    impressions: int = 10000,
    likes: int = 300,
    comments: int = 50,
    shares: int = 40,
    saves: int = 110,
) -> HistoricalPost:
    return HistoricalPost(
        id=post_id,
        platform="Instagram",
        format=fmt,
        caption="Test caption",
        product_id=None,
        category="Styling",
        audience=audience,
        objective="Engagement",
        posted_date="2026-07-01",
        impressions=impressions,
        likes=likes,
        comments=comments,
        shares=shares,
        saves=saves,
        clicks=200,
        conversions=20,
    )


class TestEngagementRate:
    def test_basic_er(self):
        post = make_post("p1", impressions=10000, likes=300, comments=50, shares=40, saves=110)
        # ER = (300+50+40+110) / 10000 * 100 = 5.0%
        assert post.engagement_rate == 5.0

    def test_zero_impressions(self):
        post = make_post("p2", impressions=0)
        assert post.engagement_rate == 0.0

    def test_high_er(self):
        post = make_post("p3", impressions=100000, likes=8000, comments=1000, shares=1500, saves=1500)
        # ER = (8000+1000+1500+1500) / 100000 * 100 = 12.0%
        assert post.engagement_rate == 12.0


class TestBrandAverageER:
    def setup_method(self):
        self.analytics = AnalyticsService()

    def test_brand_avg_two_posts(self):
        posts = [
            make_post("p1", impressions=10000, likes=300, comments=50, shares=40, saves=110),  # 5.0%
            make_post("p2", impressions=10000, likes=100, comments=20, shares=10, saves=30),   # 1.6%
        ]
        avg = self.analytics._brand_avg_er(posts)
        assert avg == pytest.approx(3.3, abs=0.1)

    def test_empty_posts_returns_zero(self):
        avg = self.analytics._brand_avg_er([])
        assert avg == 0.0


class TestFormatAvgER:
    def setup_method(self):
        self.analytics = AnalyticsService()

    def test_format_filter(self):
        posts = [
            make_post("p1", fmt="Carousel", impressions=10000, likes=500, comments=80, shares=70, saves=200),  # 8.5%
            make_post("p2", fmt="Carousel", impressions=10000, likes=450, comments=70, shares=60, saves=180),  # 7.6%
            make_post("p3", fmt="Static Post", impressions=10000, likes=100, comments=10, shares=5, saves=15), # 1.3%
        ]
        carousel_avg = self.analytics.format_avg_er(posts, "Carousel")
        static_avg = self.analytics.format_avg_er(posts, "Static Post")
        assert carousel_avg > static_avg
        assert carousel_avg == pytest.approx(8.05, abs=0.1)
        assert static_avg == pytest.approx(1.3, abs=0.1)

    def test_unknown_format_returns_zero(self):
        posts = [make_post("p1")]
        assert self.analytics.format_avg_er(posts, "TikTok") == 0.0


class TestPerformanceSummary:
    def setup_method(self):
        self.analytics = AnalyticsService()

    def test_summary_structure(self):
        posts = [
            make_post("p1", fmt="Carousel", audience="Gen-Z"),
            make_post("p2", fmt="Reel", audience="Young Millennial"),
        ]
        summary = self.analytics.compute_summary(posts)
        assert summary.total_posts == 2
        assert len(summary.by_format) == 2
        assert len(summary.by_audience) == 2
        assert summary.brand_avg_engagement_rate > 0

    def test_top_format_is_highest_er(self):
        posts = [
            make_post("p1", fmt="Carousel", impressions=10000, likes=800, comments=100, shares=80, saves=300),  # 12.8%
            make_post("p2", fmt="Static Post", impressions=10000, likes=100, comments=10, shares=5, saves=15),  # 1.3%
        ]
        summary = self.analytics.compute_summary(posts)
        assert summary.top_performing_format == "Carousel"
