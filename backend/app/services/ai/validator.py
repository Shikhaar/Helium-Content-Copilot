"""
Content Quality Validator for Helium Content Studio.

Deterministic quality checks for AI-generated social content:
1. Schema & Structure Validation (required fields, slide count)
2. Headline Constraint (maximum 8 words per slide/scene)
3. Anti-Cliché / Banned AI Phrase Detection
4. Generic Opening Pattern Detection
5. Excessive Exclamation Mark & Fake Excitement Detection
6. Unsupported Product & Discount Claims Detection
7. CTA & Hashtag Conformance
"""
from __future__ import annotations

import re
from typing import Any
from pydantic import BaseModel, Field
from app.models.schemas import AIContentRaw, Product, PostFormat


BANNED_PHRASES = [
    "summer is the perfect time",
    "ready to express",
    "ready to show off",
    "ready to elevate",
    "how are you rocking",
    "show us your style",
    "express your style",
    "elevate your style",
    "elevate your wardrobe",
    "step up your game",
    "level up your wardrobe",
    "take your style to the next level",
    "effortlessly stylish",
    "effortless style",
    "timeless sophistication",
    "where style meets comfort",
    "designed for the modern man",
    "redefine your style",
    "upgrade your wardrobe",
    "make a statement",
    "turn heads",
    "your new wardrobe essential",
    "the perfect blend of",
    "from day to night",
    "whether you're",
    "unleash your",
    "discover the perfect",
    "unlock your style",
    "stand out from the crowd",
    "say hello to",
    "here's how to elevate",
    "game-changer",
    "must-have item",
    "share your looks with us",
    "join the street style challenge",
    "join the challenge",
]

GENERIC_OPENING_PATTERNS = [
    r"^\s*summer is the perfect time",
    r"^\s*are you ready to",
    r"^\s*ready to (take|elevate|level up|show)",
    r"^\s*how are you rocking",
    r"^\s*looking for the perfect",
    r"^\s*it's time to upgrade",
]

UNSUPPORTED_CLAIM_PATTERNS = [
    r"\b\d+%\s*off\b",
    r"\bflat\s*\d+%\b",
    r"\bdiscount\b",
    r"\blimited\s*time\s*offer\b",
    r"\bcelebrity\b",
    r"\baward-winning\b",
    r"\bguarantee[d]?\b",
    r"\bfree\s*shipping\b",
]


class ValidationViolation(BaseModel):
    type: str  # e.g. "banned_phrase", "headline_length", "unsupported_claim", "structure", "generic_opening"
    field: str  # e.g. "slides[0].headline", "caption", "hashtags"
    message: str


class ValidationResult(BaseModel):
    valid: bool
    violations: list[ValidationViolation] = Field(default_factory=list)


class ContentQualityValidator:
    """Deterministic validation guardrail for AI-generated fashion content."""

    @classmethod
    def validate(
        cls,
        content: AIContentRaw,
        product: Product,
        format_type: PostFormat | str,
    ) -> ValidationResult:
        violations: list[ValidationViolation] = []

        # 1. Structure & Slide Count Validation
        cls._validate_format_structure(content, format_type, violations)

        # 2. Headline Word Counts
        cls._validate_headlines(content, violations)

        # 3. Anti-Cliché Banned Phrase Detection
        cls._detect_banned_phrases(content, violations)

        # 4. Generic Opening Pattern Detection
        cls._detect_generic_openings(content, violations)

        # 5. Excessive Exclamation Mark & Fake Excitement Detection
        cls._detect_excessive_exclamation_marks(content, violations)

        # 6. Unsupported Claims Detection
        cls._detect_unsupported_claims(content, product, violations)

        # 7. CTA & Hashtag Validation
        cls._validate_cta_and_hashtags(content, violations)

        return ValidationResult(
            valid=len(violations) == 0,
            violations=violations,
        )

    @classmethod
    def _validate_format_structure(
        cls,
        content: AIContentRaw,
        format_type: PostFormat | str,
        violations: list[ValidationViolation],
    ) -> None:
        num_slides = len(content.slides)
        if num_slides < 3:
            violations.append(
                ValidationViolation(
                    type="structure",
                    field="slides",
                    message=f"Too few slides/scenes generated ({num_slides}). Minimum required is 3.",
                )
            )
        elif num_slides > 7:
            violations.append(
                ValidationViolation(
                    type="structure",
                    field="slides",
                    message=f"Too many slides/scenes generated ({num_slides}). Maximum allowed is 7.",
                )
            )

        if not content.caption or not content.caption.strip():
            violations.append(
                ValidationViolation(
                    type="structure",
                    field="caption",
                    message="Caption cannot be empty.",
                )
            )

    @classmethod
    def _validate_headlines(
        cls,
        content: AIContentRaw,
        violations: list[ValidationViolation],
    ) -> None:
        for idx, slide in enumerate(content.slides):
            word_count = len(slide.headline.strip().split())
            if word_count > 9:  # generous 8-word target with tolerance
                violations.append(
                    ValidationViolation(
                        type="headline_length",
                        field=f"slides[{idx}].headline",
                        message=f"Slide {idx + 1} headline is too long ({word_count} words). Maximum target is 8 words.",
                    )
                )

    @classmethod
    def _detect_banned_phrases(
        cls,
        content: AIContentRaw,
        violations: list[ValidationViolation],
    ) -> None:
        # Check caption
        caption_lower = content.caption.lower()
        for phrase in BANNED_PHRASES:
            if phrase in caption_lower:
                violations.append(
                    ValidationViolation(
                        type="banned_phrase",
                        field="caption",
                        message=f"Contains generic AI phrase: '{phrase}'",
                    )
                )

        # Check slides
        for idx, slide in enumerate(content.slides):
            text_lower = f"{slide.headline} {slide.body}".lower()
            for phrase in BANNED_PHRASES:
                if phrase in text_lower:
                    violations.append(
                        ValidationViolation(
                            type="banned_phrase",
                            field=f"slides[{idx}]",
                            message=f"Slide {idx + 1} contains generic AI phrase: '{phrase}'",
                        )
                    )

    @classmethod
    def _detect_generic_openings(
        cls,
        content: AIContentRaw,
        violations: list[ValidationViolation],
    ) -> None:
        for pattern in GENERIC_OPENING_PATTERNS:
            if re.search(pattern, content.caption, re.IGNORECASE):
                violations.append(
                    ValidationViolation(
                        type="generic_opening",
                        field="caption",
                        message=f"Caption starts with predictable AI opener matching: '{pattern}'",
                    )
                )
            if content.slides and re.search(pattern, content.slides[0].headline, re.IGNORECASE):
                violations.append(
                    ValidationViolation(
                        type="generic_opening",
                        field="slides[0].headline",
                        message=f"Hook headline starts with predictable AI opener matching: '{pattern}'",
                    )
                )

    @classmethod
    def _detect_excessive_exclamation_marks(
        cls,
        content: AIContentRaw,
        violations: list[ValidationViolation],
    ) -> None:
        caption_exclamations = content.caption.count("!")
        if caption_exclamations >= 3:
            violations.append(
                ValidationViolation(
                    type="tone",
                    field="caption",
                    message=f"Excessive exclamation marks ({caption_exclamations}) detected. Keep tone grounded and confident.",
                )
            )

    @classmethod
    def _detect_unsupported_claims(
        cls,
        content: AIContentRaw,
        product: Product,
        violations: list[ValidationViolation],
    ) -> None:
        all_text = f"{content.caption} " + " ".join(
            f"{s.headline} {s.body}" for s in content.slides
        )
        for pattern in UNSUPPORTED_CLAIM_PATTERNS:
            match = re.search(pattern, all_text, re.IGNORECASE)
            if match:
                violations.append(
                    ValidationViolation(
                        type="unsupported_claim",
                        field="content",
                        message=f"Contains unsupported discount/offer claim: '{match.group(0)}'",
                    )
                )

    @classmethod
    def _validate_cta_and_hashtags(
        cls,
        content: AIContentRaw,
        violations: list[ValidationViolation],
    ) -> None:
        if not content.cta or not content.cta.strip():
            violations.append(
                ValidationViolation(
                    type="cta",
                    field="cta",
                    message="Call-to-action (CTA) cannot be empty.",
                )
            )

        if len(content.hashtags) < 3:
            violations.append(
                ValidationViolation(
                    type="hashtags",
                    field="hashtags",
                    message="At least 3 specific hashtags required.",
                )
            )
