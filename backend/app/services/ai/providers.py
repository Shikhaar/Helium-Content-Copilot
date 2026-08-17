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
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model
        logger.info("OpenAIProvider initialised | model=%s", self._model)

    async def get_opportunities(
        self,
        brand: Brand,
        products: list[Product],
        posts: list[HistoricalPost],
        performance: PerformanceSummary,
    ) -> tuple[AIOpportunitiesResponse, bool]:
        system = build_strategist_system_prompt()
        user = build_strategist_user_prompt(brand, products, posts, performance)

        logger.info("Calling OpenAI for content opportunities | model=%s", self._model)
        t0 = time.perf_counter()

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
        raw_json = response.choices[0].message.content
        logger.info("OpenAI responded in %dms", latency_ms)
        logger.debug("Raw opportunities JSON: %s", raw_json[:300])

        data = json.loads(raw_json)
        validated = AIOpportunitiesResponse(**data)
        return validated, False

    async def generate_content(
        self,
        opportunity: Opportunity,
        product: Product,
        request: GenerateContentRequest,
        brand: Brand,
    ) -> tuple[AIContentRaw, bool]:
        system = build_content_generator_system_prompt(brand)
        user = build_content_generator_user_prompt(opportunity, product, request, brand)

        logger.info(
            "Calling OpenAI for content generation | opportunity='%s'", opportunity.title
        )
        t0 = time.perf_counter()

        response = await self._client.chat.completions.create(
            model=self._model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.8,
            max_tokens=1500,
        )

        latency_ms = round((time.perf_counter() - t0) * 1000)
        raw_json = response.choices[0].message.content
        logger.info("OpenAI content generation responded in %dms", latency_ms)

        data = json.loads(raw_json)
        validated = AIContentRaw(**data)
        return validated, False


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
