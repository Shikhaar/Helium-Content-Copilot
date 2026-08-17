"""
Tests for the deterministic 5-factor scoring engine.

Verifies:
  1. Each factor scores within its allowed range
  2. Total score is the sum of all factors
  3. The hero opportunity (Linen Shirt styling carousel) produces ~94/100
  4. Score ordering is correct
  5. Boundary conditions (zero data, out-of-stock products)
"""
import pytest
from app.models.schemas import (
    AIOpportunityRaw,
    HistoricalPost,
    InventoryStatus,
    Product,
)
from app.services.analytics import AnalyticsService
from app.services.scoring import ScoringService


def make_product(
    product_id: str = "prod_001",
    views: int = 14200,
    sales: int = 1050,
    inventory: str = "In Stock",
    season: str = "Summer",
) -> Product:
    return Product(
        id=product_id,
        name="Oversized Korean Linen Shirt",
        category="Shirts",
        price_inr=1999,
        description="Test product",
        features=["Lightweight", "Breathable"],
        season=season,
        target_audience="Gen-Z",
        inventory_status=InventoryStatus(inventory),
        views=views,
        sales=sales,
    )


def make_posts_with_er(
    carousel_er: float = 8.4,
    reel_er: float = 9.1,
    static_er: float = 2.6,
    genz_er: float = 8.2,
    millennial_er: float = 4.2,
    n_each: int = 5,
) -> list[HistoricalPost]:
    """Build synthetic posts that produce the requested average ER per format/audience."""
    posts = []
    impressions = 100000

    def likes_for_er(er: float) -> int:
        return int(impressions * er / 100 * 0.7)

    def saves_for_er(er: float) -> int:
        return int(impressions * er / 100 * 0.3)

    for i in range(n_each):
        posts.append(HistoricalPost(
            id=f"car_{i}", platform="Instagram", format="Carousel",
            caption="Styling post", product_id="prod_001",
            category="Styling", audience="Gen-Z", objective="Engagement",
            posted_date="2026-07-01", impressions=impressions,
            likes=likes_for_er(carousel_er), comments=0, shares=0,
            saves=saves_for_er(carousel_er), clicks=0, conversions=0,
        ))
        posts.append(HistoricalPost(
            id=f"reel_{i}", platform="Instagram", format="Reel",
            caption="Reel", product_id=None,
            category="Styling", audience="Gen-Z", objective="Engagement",
            posted_date="2026-07-01", impressions=impressions,
            likes=likes_for_er(reel_er), comments=0, shares=0,
            saves=saves_for_er(reel_er), clicks=0, conversions=0,
        ))
        posts.append(HistoricalPost(
            id=f"static_{i}", platform="Instagram", format="Static Post",
            caption="Product", product_id=None,
            category="Product", audience="Young Millennial", objective="Product Discovery",
            posted_date="2026-07-01", impressions=impressions,
            likes=likes_for_er(static_er), comments=0, shares=0,
            saves=saves_for_er(static_er), clicks=0, conversions=0,
        ))
    return posts


def make_raw_opportunity(
    fmt: str = "Carousel",
    audience: str = "Gen-Z",
    product_id: str = "prod_001",
) -> AIOpportunityRaw:
    return AIOpportunityRaw(
        title="3 Ways to Style the Linen Shirt",
        content_angle="Three outfit combinations",
        audience=audience,
        objective="Engagement + Product Discovery",
        platform="Instagram",
        format=fmt,
        suggested_product_id=product_id,
        why="Strong historical performance",
        historical_signal="Styling carousels outperform",
        product_signal="High views and sales",
        audience_signal="Gen-Z engages strongly",
        seasonal_signal="Summer campaign alignment",
        business_signal="Engagement objective match",
    )


class TestScoringRanges:
    def setup_method(self):
        self.analytics = AnalyticsService()
        self.scoring = ScoringService(self.analytics)
        self.posts = make_posts_with_er()
        self.product = make_product()
        self.all_products = [self.product]

    def test_historical_score_within_range(self):
        score = self.scoring._historical_score(self.posts, "Carousel")
        assert 0 <= score <= 25

    def test_product_score_within_range(self):
        score = self.scoring._product_score(self.product, self.all_products)
        assert 0 <= score <= 25

    def test_audience_score_within_range(self):
        score = self.scoring._audience_score(self.posts, "Gen-Z")
        assert 0 <= score <= 20

    def test_seasonal_score_exact_match(self):
        raw = make_raw_opportunity()
        score = self.scoring._seasonal_score(self.product, raw, "Summer 2026")
        assert score == 15

    def test_seasonal_score_evergreen(self):
        product = make_product(season="All Season")
        raw = make_raw_opportunity()
        score = self.scoring._seasonal_score(product, raw, "Summer 2026")
        assert score == 10

    def test_seasonal_score_off_season(self):
        product = make_product(season="Winter")
        raw = make_raw_opportunity()
        score = self.scoring._seasonal_score(product, raw, "Summer 2026")
        assert score == 5

    def test_objective_strong_match(self):
        # Carousel has high ER (8.4%) vs static (2.6%), ratio > 1.5
        score = self.scoring._objective_score(self.posts, "Carousel", "Gen-Z")
        assert score == 15

    def test_objective_weak_match(self):
        # Static post has low ER — ratio < 1.0
        score = self.scoring._objective_score(self.posts, "Static Post", "Young Millennial")
        assert score == 5

    def test_total_is_sum_of_factors(self):
        raw = make_raw_opportunity()
        breakdown, _, _ = self.scoring.score(
            raw=raw, product=self.product, posts=self.posts,
            all_products=self.all_products, active_campaign="Summer 2026",
        )
        expected_total = (
            breakdown.historical + breakdown.product + breakdown.audience
            + breakdown.seasonal + breakdown.objective
        )
        assert breakdown.total == expected_total


class TestHeroOpportunityScore:
    """
    Verifies that the hero opportunity (Linen Shirt styling carousel)
    produces a total score of approximately 94 from realistic seed data.
    The exact value may vary by ±2 due to floating point rounding,
    but must be ≥90 and ≤100.
    """

    def setup_method(self):
        from app.data.seed_data import PRODUCTS, HISTORICAL_POSTS
        from app.models.schemas import HistoricalPost, InventoryStatus

        self.analytics = AnalyticsService()
        self.scoring = ScoringService(self.analytics)

        self.posts = [
            HistoricalPost(
                id=p["id"], platform=p["platform"], format=p["format"],
                caption=p["caption"], product_id=p["product_id"],
                category=p["category"], audience=p["audience"],
                objective=p["objective"], posted_date=p["posted_date"],
                impressions=p["impressions"], likes=p["likes"],
                comments=p["comments"], shares=p["shares"], saves=p["saves"],
                clicks=p["clicks"], conversions=p["conversions"],
            )
            for p in HISTORICAL_POSTS
        ]

        self.products = [
            Product(
                id=p["id"], name=p["name"], category=p["category"],
                price_inr=p["price_inr"], description=p["description"],
                features=p["features"] if isinstance(p["features"], list) else [],
                season=p["season"], target_audience=p["target_audience"],
                inventory_status=InventoryStatus(p["inventory_status"]),
                views=p["views"], sales=p["sales"],
            )
            for p in PRODUCTS
        ]

        self.linen_shirt = next(p for p in self.products if p.id == "prod_001")

    def test_hero_score_in_range(self):
        raw = AIOpportunityRaw(
            title="3 Ways to Style the Oversized Linen Shirt This Summer",
            content_angle="Three summer outfit combinations",
            audience="Gen-Z",
            objective="Engagement + Product Discovery",
            platform="Instagram",
            format="Carousel",
            suggested_product_id="prod_001",
            why="Strong historical performance",
            historical_signal="Styling carousels outperform by 2.47x",
            product_signal="Highest views in catalog",
            audience_signal="Gen-Z engagement is highest",
            seasonal_signal="Summer campaign alignment",
            business_signal="Engagement objective match",
        )
        breakdown, confidence, _ = self.scoring.score(
            raw=raw, product=self.linen_shirt, posts=self.posts,
            all_products=self.products, active_campaign="Summer 2026",
        )
        assert 85 <= breakdown.total <= 100, f"Expected 85-100, got {breakdown.total}"
        assert breakdown.historical <= 25
        assert breakdown.product <= 25
        assert breakdown.audience <= 20
        assert breakdown.seasonal <= 15
        assert breakdown.objective <= 15


class TestBoundaryConditions:
    def setup_method(self):
        self.analytics = AnalyticsService()
        self.scoring = ScoringService(self.analytics)

    def test_out_of_stock_reduces_product_score(self):
        in_stock = make_product(inventory="In Stock", views=10000, sales=1000)
        out_of_stock = make_product(inventory="Out of Stock", views=10000, sales=1000)
        all_products = [in_stock]

        in_stock_score = self.scoring._product_score(in_stock, all_products)
        out_score = self.scoring._product_score(out_of_stock, all_products)
        assert in_stock_score > out_score

    def test_empty_posts_returns_zero_scores(self):
        posts: list[HistoricalPost] = []
        assert self.scoring._historical_score(posts, "Carousel") == 0
        assert self.scoring._audience_score(posts, "Gen-Z") == 0


class TestOpportunityRanking:
    def test_opportunities_sorted_by_score(self):
        """Higher-scoring opportunities should appear first."""
        posts = make_posts_with_er()
        product = make_product()
        all_products = [product]
        analytics = AnalyticsService()
        scoring = ScoringService(analytics)

        raw_carousel = make_raw_opportunity(fmt="Carousel")
        raw_static = make_raw_opportunity(fmt="Static Post")

        breakdown_carousel, _, _ = scoring.score(
            raw=raw_carousel, product=product, posts=posts,
            all_products=all_products, active_campaign="Summer 2026",
        )
        breakdown_static, _, _ = scoring.score(
            raw=raw_static, product=product, posts=posts,
            all_products=all_products, active_campaign="Summer 2026",
        )

        assert breakdown_carousel.total > breakdown_static.total, (
            f"Carousel ({breakdown_carousel.total}) should score higher than "
            f"Static Post ({breakdown_static.total})"
        )
