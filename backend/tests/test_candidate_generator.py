"""
Tests for CandidateGenerationService (Stage 1 of Recommendation Engine).

Verifies:
  1. Candidates are generated from catalog products and performance rollups.
  2. Candidate count is strictly bounded (not raw Cartesian explosion).
  3. Out-of-stock items are deprioritized.
  4. Candidate objects remain un-scored (numeric score calculation is deferred to ScoringService).
"""
import json
import pytest
from app.models.schemas import (
    Brand,
    BrandAudience,
    CandidateOpportunity,
    InventoryStatus,
    PerformanceSummary,
    FormatPerformance,
    AudiencePerformance,
    Product,
)
from app.services.candidate_generator import CandidateGenerationService


@pytest.fixture
def sample_brand() -> Brand:
    return Brand(
        id="snitch",
        workspace_id="default_workspace",
        name="SNITCH",
        description="Men's fashion brand",
        tone=["Bold", "Minimal"],
        audience=BrandAudience(
            age_range="18-30",
            location="India",
            interests=["Streetwear"],
            shopping_behavior=["Reels"],
        ),
        campaign="Summer 2026",
    )


@pytest.fixture
def sample_products() -> list[Product]:
    return [
        Product(
            id="prod_01",
            brand_id="snitch",
            name="Linen Shirt",
            category="Shirts",
            price_inr=1999,
            description="Summer linen",
            features=["Linen", "Dropped shoulder"],
            season="Summer",
            target_audience="Gen-Z",
            inventory_status=InventoryStatus.IN_STOCK,
            views=14000,
            sales=1000,
        ),
        Product(
            id="prod_02",
            brand_id="snitch",
            name="Cargo Pants",
            category="Bottoms",
            price_inr=2499,
            description="Parachute cargo",
            features=["6 pockets", "Parachute"],
            season="All Season",
            target_audience="Gen-Z",
            inventory_status=InventoryStatus.IN_STOCK,
            views=12000,
            sales=900,
        ),
        Product(
            id="prod_03",
            brand_id="snitch",
            name="Soldout Jacket",
            category="Outerwear",
            price_inr=3999,
            description="Winter jacket",
            features=["Fleece"],
            season="Winter",
            target_audience="Young Millennial",
            inventory_status=InventoryStatus.OUT_OF_STOCK,
            views=2000,
            sales=50,
        ),
    ]


@pytest.fixture
def sample_performance() -> PerformanceSummary:
    return PerformanceSummary(
        brand_avg_engagement_rate=4.8,
        total_posts=25,
        by_format=[
            FormatPerformance(format="Reel", avg_engagement_rate=8.8, post_count=10),
            FormatPerformance(format="Carousel", avg_engagement_rate=6.2, post_count=10),
            FormatPerformance(format="Static Post", avg_engagement_rate=2.4, post_count=5),
        ],
        by_audience=[
            AudiencePerformance(audience="Gen-Z", avg_engagement_rate=6.1, post_count=18),
            AudiencePerformance(audience="Young Millennial", avg_engagement_rate=5.3, post_count=7),
        ],
        top_performing_format="Reel",
        top_performing_audience="Gen-Z",
    )


def test_candidate_generation_produces_bounded_candidates(sample_brand, sample_products, sample_performance):
    generator = CandidateGenerationService()
    candidates = generator.generate_candidates(
        brand=sample_brand,
        products=sample_products,
        performance=sample_performance,
        max_candidates=10,
    )

    assert len(candidates) > 0
    assert len(candidates) <= 10
    assert all(isinstance(c, CandidateOpportunity) for c in candidates)


def test_candidates_have_no_numeric_scores(sample_brand, sample_products, sample_performance):
    generator = CandidateGenerationService()
    candidates = generator.generate_candidates(
        brand=sample_brand,
        products=sample_products,
        performance=sample_performance,
    )

    for c in candidates:
        assert not hasattr(c, "score") or getattr(c, "score", None) is None
        assert c.product_id in ["prod_01", "prod_02"]
        assert c.format in ["Reel", "Carousel"]
        assert c.platform == "Instagram"
        assert c.campaign == "Summer 2026"


def test_out_of_stock_products_deprioritized(sample_brand, sample_products, sample_performance):
    generator = CandidateGenerationService()
    candidates = generator.generate_candidates(
        brand=sample_brand,
        products=sample_products,
        performance=sample_performance,
    )

    product_ids = [c.product_id for c in candidates]
    # In-stock products must be present
    assert "prod_01" in product_ids
    assert "prod_02" in product_ids
    # Out of stock item should not be in the primary candidates
    assert "prod_03" not in product_ids
