"""
AI Provider — OpenAI integration with automatic fallback.

Architecture (Provider Pattern):
  BaseAIProvider           — abstract interface
  OpenAIProvider           — calls OpenAI Chat Completions API
  FallbackAIProvider       — returns deterministic demo data when AI unavailable

The StrategistService and ContentGeneratorService only interact with
BaseAIProvider, making the underlying model swappable without touching
business logic.
"""
from __future__ import annotations

import json
import time
from abc import ABC, abstractmethod

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.schemas import (
    AIContentRaw,
    AIOpportunitiesResponse,
    Brand,
    CarouselSlide,
    GenerateContentRequest,
    HistoricalPost,
    Opportunity,
    PerformanceSummary,
    Product,
)
from app.services.ai.prompts import (
    build_content_generator_system_prompt,
    build_content_generator_user_prompt,
    build_strategist_system_prompt,
    build_strategist_user_prompt,
)
from app.services.ai.fallback_data import FALLBACK_OPPORTUNITIES, FALLBACK_CONTENT
from app.services.ai.validator import ContentQualityValidator

logger = get_logger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Abstract Base
# ──────────────────────────────────────────────────────────────────────────────

class BaseAIProvider(ABC):
    """Interface that all AI providers must implement."""

    @abstractmethod
    async def get_opportunities(
        self,
        brand: Brand,
        products: list[Product],
        posts: list[HistoricalPost],
        performance: PerformanceSummary,
    ) -> tuple[AIOpportunitiesResponse, bool]:
        """
        Returns (response, is_demo).
        is_demo=True when fallback data was used.
        """
        ...

    @abstractmethod
    async def generate_content(
        self,
        opportunity: Opportunity,
        product: Product,
        request: GenerateContentRequest,
        brand: Brand,
    ) -> tuple[AIContentRaw, bool]:
        """
        Returns (content, is_demo).
        is_demo=True when fallback data was used.
        """
        ...


# ──────────────────────────────────────────────────────────────────────────────
# OpenAI Provider
# ──────────────────────────────────────────────────────────────────────────────

class OpenAIProvider(BaseAIProvider):
    """Calls the OpenAI Chat Completions API with JSON mode enabled."""

    def __init__(self) -> None:
        from openai import AsyncOpenAI  # type: ignore
        client_kwargs = {"api_key": settings.effective_api_key}
        if settings.effective_base_url:
            client_kwargs["base_url"] = settings.effective_base_url
        self._client = AsyncOpenAI(**client_kwargs)
        self._model = settings.effective_model
        logger.info(
            "OpenAIProvider initialised | model=%s | base_url=%s",
            self._model, settings.effective_base_url or "https://api.openai.com/v1"
        )

    async def get_opportunities(
        self,
        brand: Brand,
        products: list[Product],
        posts: list[HistoricalPost],
        performance: PerformanceSummary,
    ) -> tuple[AIOpportunitiesResponse, bool]:
        system = build_strategist_system_prompt()
        user = build_strategist_user_prompt(brand, products, posts, performance)

        logger.info("Calling AI provider for content opportunities | model=%s", self._model)
        t0 = time.perf_counter()

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            latency_ms = round((time.perf_counter() - t0) * 1000)
            raw_json = response.choices[0].message.content or "{}"
            logger.info("AI provider responded in %dms", latency_ms)
            logger.debug("Raw opportunities JSON: %s", raw_json[:300])

            data = json.loads(raw_json)
            validated = AIOpportunitiesResponse(**data)
            return validated, False
        except Exception as exc:
            logger.warning("AI provider get_opportunities error (%s) — using fallback demo data", exc)
            return AIOpportunitiesResponse(opportunities=FALLBACK_OPPORTUNITIES), True

    async def generate_content(
        self,
        opportunity: Opportunity,
        product: Product,
        request: GenerateContentRequest,
        brand: Brand,
    ) -> tuple[AIContentRaw, bool]:
        system = build_content_generator_system_prompt(brand, request)
        user = build_content_generator_user_prompt(opportunity, product, request, brand)

        logger.info(
            "Calling AI provider for content generation | opportunity='%s' | model=%s",
            opportunity.title, self._model
        )
        t0 = time.perf_counter()

        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.75,
                max_tokens=1500,
            )

            latency_ms = round((time.perf_counter() - t0) * 1000)
            raw_json = response.choices[0].message.content or "{}"
            logger.info("AI content generation responded in %dms", latency_ms)

            data = json.loads(raw_json)
            validated = AIContentRaw(**data)

            # Deterministic Content Quality Validation Guardrail
            validation_result = ContentQualityValidator.validate(validated, product, request.format)
            if validation_result.valid:
                logger.info("Content passed quality validation guardrail on attempt 1")
                return validated, False

            logger.warning(
                "Content failed quality validation guardrail with %d violation(s): %s. Initiating retry...",
                len(validation_result.violations),
                [v.message for v in validation_result.violations],
            )

            # Structured single retry with violation feedback
            violations_text = "\n".join(f"- [{v.field}] {v.message}" for v in validation_result.violations)
            retry_prompt = (
                f"The previous output failed quality validation for the following reason(s):\n"
                f"{violations_text}\n\n"
                f"Please regenerate the content strictly fixing all these violations. "
                f"Ensure headlines are max 8 words and avoid banned generic phrases. Return valid JSON only."
            )

            retry_response = await self._client.chat.completions.create(
                model=self._model,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                    {"role": "assistant", "content": raw_json},
                    {"role": "user", "content": retry_prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
            )

            retry_raw_json = retry_response.choices[0].message.content or "{}"
            retry_data = json.loads(retry_raw_json)
            retry_validated = AIContentRaw(**retry_data)

            retry_validation = ContentQualityValidator.validate(retry_validated, product, request.format)
            if retry_validation.valid:
                logger.info("Content passed quality validation guardrail on retry attempt")
                return retry_validated, False
            else:
                logger.warning("Retry attempt still had %d violation(s), accepting best effort output", len(retry_validation.violations))
                return retry_validated, False

        except Exception as exc:
            logger.warning("AI provider generate_content error (%s) — using fallback demo data", exc)
            content_key = opportunity.id if opportunity.id in FALLBACK_CONTENT else "default"
            return FALLBACK_CONTENT[content_key], True


# ──────────────────────────────────────────────────────────────────────────────
# Fallback Provider (deterministic demo data)
# ──────────────────────────────────────────────────────────────────────────────

class FallbackAIProvider(BaseAIProvider):
    """
    Returns high-fidelity deterministic demo responses when the LLM API
    is unavailable or no API key is configured.

    This ensures the recruiter can always complete the full demo workflow
    even without an internet connection or API key.
    """

    def __init__(self) -> None:
        logger.info("FallbackAIProvider initialised — demo mode active")

    async def get_opportunities(
        self,
        brand: Brand,
        products: list[Product],
        posts: list[HistoricalPost],
        performance: PerformanceSummary,
    ) -> tuple[AIOpportunitiesResponse, bool]:
        logger.info("Using fallback opportunity data (demo mode)")
        return AIOpportunitiesResponse(opportunities=FALLBACK_OPPORTUNITIES), True

    async def generate_content(
        self,
        opportunity: Opportunity,
        product: Product,
        request: GenerateContentRequest,
        brand: Brand,
    ) -> tuple[AIContentRaw, bool]:
        logger.info("Using fallback content data (demo mode)")
        content_key = opportunity.id if opportunity.id in FALLBACK_CONTENT else "default"
        return FALLBACK_CONTENT[content_key], True


# ──────────────────────────────────────────────────────────────────────────────
# Provider Factory
# ──────────────────────────────────────────────────────────────────────────────

def get_ai_provider() -> BaseAIProvider:
    """
    Return the appropriate AI provider based on configuration.
    Falls back to FallbackAIProvider if no API key is configured or
    if the OpenAI client fails to initialise.
    """
    if not settings.ai_enabled:
        logger.info("No API key configured — using FallbackAIProvider")
        return FallbackAIProvider()

    try:
        return OpenAIProvider()
    except Exception as exc:
        logger.warning("Failed to initialise OpenAIProvider (%s) — using fallback", exc)
        return FallbackAIProvider()
