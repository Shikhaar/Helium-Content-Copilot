"""
Pydantic schemas for all domain entities used across the API.

Separation of concerns:
  - Domain models (Brand, Product, HistoricalPost) represent stored data.
  - Request/Response schemas are what the API sends and receives.
  - The LLM never sees or produces numeric scores — only qualitative signals.
    All numeric computation happens in ScoringService.
"""
from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


# ──────────────────────────────────────────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────────────────────────────────────────

class Platform(str, Enum):
    INSTAGRAM = "Instagram"
    LINKEDIN = "LinkedIn"
    X = "X"


class PostFormat(str, Enum):
    CAROUSEL = "Carousel"
    REEL = "Reel"
    STATIC = "Static Post"


class Objective(str, Enum):
    ENGAGEMENT = "Engagement"
    PRODUCT_DISCOVERY = "Product Discovery"
    ENGAGEMENT_DISCOVERY = "Engagement + Product Discovery"
    CONVERSION = "Conversion"
    EDUCATION = "Education"
    EDUCATION_ENGAGEMENT = "Education + Engagement"
    AWARENESS = "Awareness"


class InventoryStatus(str, Enum):
    IN_STOCK = "In Stock"
    OUT_OF_STOCK = "Out of Stock"
    LOW_STOCK = "Low Stock"


class ContentStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"


class Confidence(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


# ──────────────────────────────────────────────────────────────────────────────
# Domain Models
# ──────────────────────────────────────────────────────────────────────────────

class BrandAudience(BaseModel):
    age_range: str
    location: str
    interests: list[str]
    shopping_behavior: list[str]


class Brand(BaseModel):
    id: str
    workspace_id: str = "default_workspace"
    name: str
    description: str
    tone: list[str]
    audience: BrandAudience
    campaign: str  # Active campaign, e.g. "Summer 2026"


class Product(BaseModel):
    id: str
    brand_id: str = "snitch"
    name: str
    category: str
    price_inr: int
    description: str
    features: list[str]
    season: str
    target_audience: str
    inventory_status: InventoryStatus
    views: int
    sales: int


class HistoricalPost(BaseModel):
    id: str
    brand_id: str = "snitch"
    platform: str
    format: str
    caption: str
    product_id: str | None
    category: str
    audience: str
    objective: str
    posted_date: str
    impressions: int
    likes: int
    comments: int
    shares: int
    saves: int
    clicks: int
    conversions: int

    @property
    def engagement_rate(self) -> float:
        """Engagement Rate = (likes + comments + shares + saves) / impressions * 100"""
        if self.impressions == 0:
            return 0.0
        return round(
            (self.likes + self.comments + self.shares + self.saves)
            / self.impressions
            * 100,
            2,
        )


# ──────────────────────────────────────────────────────────────────────────────
# Performance Aggregates
# ──────────────────────────────────────────────────────────────────────────────

class FormatPerformance(BaseModel):
    format: str
    avg_engagement_rate: float
    post_count: int


class AudiencePerformance(BaseModel):
    audience: str
    avg_engagement_rate: float
    post_count: int


class PerformanceSummary(BaseModel):
    brand_avg_engagement_rate: float
    total_posts: int
    by_format: list[FormatPerformance]
    by_audience: list[AudiencePerformance]
    top_performing_format: str
    top_performing_audience: str


# ──────────────────────────────────────────────────────────────────────────────
# Opportunity Scoring & Candidate Generation
# ──────────────────────────────────────────────────────────────────────────────

class CandidateOpportunity(BaseModel):
    """
    Unscored opportunity candidate produced by CandidateGenerationService.
    Represents a plausible Product × Winning Format × Audience × Campaign Context combination.
    """
    product_id: str
    product_name: str
    format: str
    platform: str
    audience: str
    objective: str
    campaign: str
    category: str
    inventory_status: str


class ScoreBreakdown(BaseModel):
    historical: int = Field(..., ge=0, le=25, description="Historical performance score /25")
    product: int = Field(..., ge=0, le=25, description="Product relevance score /25")
    audience: int = Field(..., ge=0, le=20, description="Audience fit score /20")
    seasonal: int = Field(..., ge=0, le=15, description="Seasonal relevance score /15")
    objective: int = Field(..., ge=0, le=15, description="Business objective fit score /15")

    @property
    def total(self) -> int:
        return self.historical + self.product + self.audience + self.seasonal + self.objective


# ──────────────────────────────────────────────────────────────────────────────
# AI Strategist Output Schema (LLM must conform to this — no numeric scores)
# ──────────────────────────────────────────────────────────────────────────────

class AIOpportunityRaw(BaseModel):
    """
    Strictly validated schema for the LLM's raw opportunity output.
    The LLM provides qualitative signals only.
    Numeric scores are calculated separately by ScoringService.
    """
    title: str
    content_angle: str
    audience: str
    objective: str
    platform: str
    format: str
    suggested_product_id: str
    why: str
    historical_signal: str
    product_signal: str
    audience_signal: str
    seasonal_signal: str
    business_signal: str


class AIOpportunitiesResponse(BaseModel):
    opportunities: list[AIOpportunityRaw]


# ──────────────────────────────────────────────────────────────────────────────
# Full Opportunity (AI signals + computed score + brand tenancy)
# ──────────────────────────────────────────────────────────────────────────────

class Opportunity(BaseModel):
    id: str
    brand_id: str = "snitch"
    analysis_run_id: str | None = None
    title: str
    content_angle: str
    audience: str
    objective: str
    platform: str
    format: str
    suggested_product_id: str
    suggested_product_name: str
    why: str
    historical_signal: str
    product_signal: str
    audience_signal: str
    seasonal_signal: str
    business_signal: str
    score: int
    score_breakdown: ScoreBreakdown
    confidence: Confidence
    confidence_reason: str
    created_at: str
    is_demo: bool = False


# ──────────────────────────────────────────────────────────────────────────────
# Content Generation
# ──────────────────────────────────────────────────────────────────────────────

class CarouselSlide(BaseModel):
    slide_number: int
    headline: str
    body: str
    visual_cue: str


class AIContentRaw(BaseModel):
    """Strictly validated schema for the LLM's content generation output."""
    slides: list[CarouselSlide]
    caption: str
    cta: str
    hashtags: list[str]


class GenerateContentRequest(BaseModel):
    opportunity_id: str
    platform: Platform = Platform.INSTAGRAM
    format: PostFormat = PostFormat.CAROUSEL
    audience: str
    objective: str  # plain str — AI may generate objectives outside the enum


class ContentDraft(BaseModel):
    id: str
    brand_id: str = "snitch"
    opportunity_id: str
    platform: str
    format: str
    audience: str
    objective: str
    slides: list[CarouselSlide]
    caption: str
    cta: str
    hashtags: list[str]
    status: ContentStatus
    scheduled_date: str | None
    scheduled_time: str | None
    created_at: str
    updated_at: str
    is_demo: bool = False


class UpdateDraftRequest(BaseModel):
    slides: list[CarouselSlide] | None = None
    caption: str | None = None
    cta: str | None = None
    hashtags: list[str] | None = None


class ScheduleRequest(BaseModel):
    scheduled_date: str = Field(..., description="e.g. 2026-08-25")
    scheduled_time: str = Field(..., description="e.g. 19:30")
    platform: Platform = Platform.INSTAGRAM


# ──────────────────────────────────────────────────────────────────────────────
# Calendar
# ──────────────────────────────────────────────────────────────────────────────

class CalendarEntry(BaseModel):
    id: str
    brand_id: str = "snitch"
    draft_id: str
    title: str
    platform: str
    format: str
    status: ContentStatus
    scheduled_datetime: str


# ──────────────────────────────────────────────────────────────────────────────
# API Response Wrappers
# ──────────────────────────────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Any = None


class AnalyzeResponse(BaseModel):
    opportunities: list[Opportunity]
    performance_summary: PerformanceSummary
    is_demo: bool = False


# ──────────────────────────────────────────────────────────────────────────────
# Management Requests
# ──────────────────────────────────────────────────────────────────────────────

class UpdateBrandRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    tone: list[str] | None = None
    campaign: str | None = None
    audience: BrandAudience | None = None


class CreateProductRequest(BaseModel):
    name: str
    category: str
    price_inr: int
    description: str = ""
    features: list[str] = Field(default_factory=list)
    season: str = "All Season"
    target_audience: str = "Young Millennial"
    inventory_status: InventoryStatus = InventoryStatus.IN_STOCK
    views: int = 0
    sales: int = 0


# ──────────────────────────────────────────────────────────────────────────────
# Authentication & User Identity (Clerk Integration)
# ──────────────────────────────────────────────────────────────────────────────

class UserContext(BaseModel):
    clerk_user_id: str
    email: str | None = None
    name: str | None = None
    avatar_url: str | None = None
    role: str = "editor"
    workspace_id: str = "default_workspace"


class UserResponse(BaseModel):
    id: str
    clerk_user_id: str
    name: str
    email: str
    avatar_url: str | None = None
    role: str = "editor"
    workspace_id: str = "default_workspace"
    created_at: str
    updated_at: str

