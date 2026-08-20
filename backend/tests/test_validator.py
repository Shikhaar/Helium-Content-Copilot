"""
Unit tests for the ContentQualityValidator guardrail in Helium.
"""
from __future__ import annotations

import pytest
from app.models.schemas import (
    AIContentRaw,
    CarouselSlide,
    InventoryStatus,
    PostFormat,
    Product,
)
from app.services.ai.validator import ContentQualityValidator, BANNED_PHRASES


@pytest.fixture
def sample_product() -> Product:
    return Product(
        id="prod_001",
        name="Cuban Collar Linen Shirt",
        category="Shirts",
        price_inr=1999,
        inventory_status=InventoryStatus.IN_STOCK,
        season="Summer 2026",
        features=["100% French linen", "Relaxed fit", "Resort collar"],
        description="A breezy linen shirt tailored for warm summer afternoons.",
        target_audience="Gen-Z",
        views=14200,
        sales=1050,
    )


@pytest.fixture
def valid_carousel_content() -> AIContentRaw:
    return AIContentRaw(
        slides=[
            CarouselSlide(
                slide_number=1,
                headline="Beach at 4. Dinner at 8.",
                body="One shirt that handles both without missing a beat.",
                visual_cue="Model wearing sage linen shirt on seaside boardwalk.",
            ),
            CarouselSlide(
                slide_number=2,
                headline="Look 01: Daytime Casual",
                body="Pair unbuttoned over a white rib tank and linen shorts.",
                visual_cue="Wide walking shot showcasing breathable movement.",
            ),
            CarouselSlide(
                slide_number=3,
                headline="Look 02: Sunset Dinner",
                body="Buttoned up with pleated ecru trousers and leather mules.",
                visual_cue="Golden hour close-up on fabric texture and resort collar.",
            ),
            CarouselSlide(
                slide_number=4,
                headline="Save This for Packing",
                body="Discover your summer rotation at SNITCH.",
                visual_cue="Flatlay of styled lookbook essentials.",
            ),
        ],
        caption="Two completely different settings. One shirt that handles both seamlessly. How would you style it?",
        cta="Discover your style — link in bio 🔗",
        hashtags=["snitch", "summerstyling", "linenoutfits", "mensfashion", "resortwear"],
    )


def test_valid_content_passes_guardrail(valid_carousel_content, sample_product):
    result = ContentQualityValidator.validate(
        content=valid_carousel_content,
        product=sample_product,
        format_type=PostFormat.CAROUSEL,
    )
    assert result.valid is True
    assert len(result.violations) == 0


def test_detects_long_headlines(valid_carousel_content, sample_product):
    # Headline with 12 words (> 8 words)
    valid_carousel_content.slides[0].headline = (
        "Here are five amazing reasons why you should definitely wear this shirt today"
    )
    result = ContentQualityValidator.validate(
        content=valid_carousel_content,
        product=sample_product,
        format_type=PostFormat.CAROUSEL,
    )
    assert result.valid is False
    violations = [v for v in result.violations if v.type == "headline_length"]
    assert len(violations) >= 1
    assert "headline is too long" in violations[0].message


def test_detects_banned_ai_phrases_in_caption(valid_carousel_content, sample_product):
    valid_carousel_content.caption = "Elevate your style with this iconic shirt designed for the modern man."
    result = ContentQualityValidator.validate(
        content=valid_carousel_content,
        product=sample_product,
        format_type=PostFormat.CAROUSEL,
    )
    assert result.valid is False
    banned_violations = [v for v in result.violations if v.type == "banned_phrase"]
    assert len(banned_violations) >= 1
    assert any("elevate your style" in v.message for v in banned_violations)


def test_detects_banned_ai_phrases_in_slides(valid_carousel_content, sample_product):
    valid_carousel_content.slides[1].body = "This piece will level up your wardrobe effortlessly."
    result = ContentQualityValidator.validate(
        content=valid_carousel_content,
        product=sample_product,
        format_type=PostFormat.CAROUSEL,
    )
    assert result.valid is False
    banned_violations = [v for v in result.violations if v.type == "banned_phrase"]
    assert len(banned_violations) >= 1
    assert any("level up your wardrobe" in v.message for v in banned_violations)


def test_detects_unsupported_discount_claims(valid_carousel_content, sample_product):
    valid_carousel_content.caption = "Get flat 50% off for a limited time offer on our website!"
    result = ContentQualityValidator.validate(
        content=valid_carousel_content,
        product=sample_product,
        format_type=PostFormat.CAROUSEL,
    )
    assert result.valid is False
    claim_violations = [v for v in result.violations if v.type == "unsupported_claim"]
    assert len(claim_violations) >= 1
    assert "unsupported discount/offer claim" in claim_violations[0].message


def test_detects_insufficient_slides(valid_carousel_content, sample_product):
    valid_carousel_content.slides = valid_carousel_content.slides[:2]  # Only 2 slides
    result = ContentQualityValidator.validate(
        content=valid_carousel_content,
        product=sample_product,
        format_type=PostFormat.CAROUSEL,
    )
    assert result.valid is False
    structure_violations = [v for v in result.violations if v.type == "structure"]
    assert len(structure_violations) >= 1
    assert "Too few slides" in structure_violations[0].message
