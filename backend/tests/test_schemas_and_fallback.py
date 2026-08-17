"""
Tests for Pydantic schema validation and AI fallback reliability.
"""
import pytest
from pydantic import ValidationError
from app.models.schemas import (
    AIOpportunityRaw,
    AIOpportunitiesResponse,
    CarouselSlide,
    AIContentRaw,
    ScoreBreakdown,
    GenerateContentRequest,
    Platform,
    PostFormat,
    Objective,
)
from app.services.ai.fallback_data import FALLBACK_OPPORTUNITIES, FALLBACK_CONTENT


class TestScoreBreakdownValidation:
    def test_valid_breakdown(self):
        sb = ScoreBreakdown(historical=24, product=23, audience=17, seasonal=15, objective=15)
        assert sb.total == 94

    def test_historical_out_of_range(self):
        with pytest.raises(ValidationError):
            ScoreBreakdown(historical=26, product=23, audience=17, seasonal=15, objective=15)

    def test_audience_out_of_range(self):
        with pytest.raises(ValidationError):
            ScoreBreakdown(historical=24, product=23, audience=21, seasonal=15, objective=15)

    def test_seasonal_out_of_range(self):
        with pytest.raises(ValidationError):
            ScoreBreakdown(historical=24, product=23, audience=17, seasonal=16, objective=15)


class TestAIOpportunitySchema:
    def test_valid_opportunity(self):
        opp = AIOpportunityRaw(
            title="Test Title",
            content_angle="Test angle",
            audience="Gen-Z",
            objective="Engagement",
            platform="Instagram",
            format="Carousel",
            suggested_product_id="prod_001",
            why="Good reason",
            historical_signal="Strong history",
            product_signal="Good product",
            audience_signal="Good audience",
            seasonal_signal="Good season",
            business_signal="Good objective",
        )
        assert opp.title == "Test Title"

    def test_missing_required_field(self):
        with pytest.raises(ValidationError):
            AIOpportunityRaw(
                title="Test",
                content_angle="angle",
                audience="Gen-Z",
                # missing required fields
            )


class TestCarouselSlideSchema:
    def test_valid_slide(self):
        slide = CarouselSlide(
            slide_number=1,
            headline="Test Headline",
            body="Test body",
            visual_cue="Visual direction",
        )
        assert slide.slide_number == 1

    def test_content_raw_valid(self):
        content = AIContentRaw(
            slides=[
                CarouselSlide(slide_number=1, headline="H1", body="B1", visual_cue="V1"),
                CarouselSlide(slide_number=2, headline="H2", body="B2", visual_cue="V2"),
            ],
            caption="Test caption",
            cta="Shop now",
            hashtags=["#test", "#snitch"],
        )
        assert len(content.slides) == 2
        assert len(content.hashtags) == 2


class TestFallbackDataValidity:
    """Ensure fallback data is always valid and can drive a full demo."""

    def test_fallback_opportunities_are_valid(self):
        assert len(FALLBACK_OPPORTUNITIES) >= 3
        for opp in FALLBACK_OPPORTUNITIES:
            assert isinstance(opp, AIOpportunityRaw)
            assert opp.title
            assert opp.suggested_product_id
            assert opp.why

    def test_fallback_content_default_is_valid(self):
        content = FALLBACK_CONTENT["default"]
        assert isinstance(content, AIContentRaw)
        assert len(content.slides) >= 3
        assert content.caption
        assert len(content.hashtags) >= 5

    def test_fallback_slides_have_all_fields(self):
        content = FALLBACK_CONTENT["default"]
        for slide in content.slides:
            assert slide.headline
            assert slide.body
            assert slide.visual_cue


class TestGenerateContentRequest:
    def test_valid_request(self):
        req = GenerateContentRequest(
            opportunity_id="some-uuid",
            platform=Platform.INSTAGRAM,
            format=PostFormat.CAROUSEL,
            audience="Gen-Z",
            objective=Objective.ENGAGEMENT_DISCOVERY,
        )
        assert req.platform == Platform.INSTAGRAM

    def test_invalid_platform(self):
        with pytest.raises(ValidationError):
            GenerateContentRequest(
                opportunity_id="uuid",
                platform="TikTok",   # not in enum
                format="Carousel",
                audience="Gen-Z",
                objective="Engagement",
            )
