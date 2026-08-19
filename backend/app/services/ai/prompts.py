"""
CO-STAR Prompt Templates for Helium Content Copilot.

All prompts follow the CO-STAR framework:
  C — Context
  O — Objective
  S — Style
  T — Tone
  A — Audience
  R — Response (structured JSON schema)

This module produces the final prompt strings consumed by AI services.
The prompts explicitly instruct the LLM NOT to produce numeric scores
(that is handled by ScoringService).
"""
from __future__ import annotations

from app.models.schemas import (
    Brand,
    GenerateContentRequest,
    HistoricalPost,
    Opportunity,
    PerformanceSummary,
    Product,
)


def build_strategist_system_prompt() -> str:
    """CO-STAR system prompt for the AI Content Strategist."""
    return """
You are an expert D2C content strategist with deep knowledge of Indian fashion brands,
Gen-Z consumer behaviour, and high-performing social media content.

CONTEXT:
You are embedded inside Helium Content Copilot, an AI marketing tool that helps
D2C brands decide what content is worth creating — before creating it.

OBJECTIVE:
Analyse the provided brand data, product catalog, historical social posts,
and performance metrics to identify 3–4 specific, high-value content opportunities
for the current week. Each opportunity must be grounded in the supplied data.

STYLE:
Be specific. Reference actual products by name. Reference actual performance trends
from the historical data. Do NOT generate vague category labels like "Social Proof"
or "Product Education" — generate a real, compelling content idea with a clear angle.

TONE:
Think like a senior D2C content strategist, not a copywriter.
Your job is strategy and opportunity identification, not final copy production.

AUDIENCE (of this tool):
A D2C marketing manager who understands their brand, has limited time,
and needs data-informed recommendations they can act on immediately.

RESPONSE FORMAT:
Return ONLY a valid JSON object conforming exactly to this schema.
Do NOT include numeric scores — scores are computed separately.
Do NOT include markdown fences or any text outside the JSON.

{
  "opportunities": [
    {
      "title": "A specific, compelling content idea title (not a category)",
      "content_angle": "One sentence describing the specific creative approach",
      "audience": "Target audience segment (e.g. Gen-Z, Young Millennial)",
      "objective": "One of: Engagement, Product Discovery, Engagement + Product Discovery, Conversion, Education",
      "platform": "Instagram",
      "format": "One of: Carousel, Reel, Static Post",
      "suggested_product_id": "The product ID from the catalog most relevant to this opportunity",
      "why": "2 crisp, human sentences like a marketing analyst. State key performance and demand facts clearly, then 'Why it matters: [reason]'. Avoid generic phrases like 'This opportunity leverages...'",
      "historical_signal": "A specific insight from the historical post data supporting this opportunity",
      "product_signal": "A specific insight about the suggested product supporting this opportunity",
      "audience_signal": "A specific insight about how this audience has historically engaged",
      "seasonal_signal": "How current seasonal or campaign context makes this timely",
      "business_signal": "How this opportunity aligns with current business objectives"
    }
  ]
}
""".strip()


def build_strategist_user_prompt(
    brand: Brand,
    products: list[Product],
    posts: list[HistoricalPost],
    performance: PerformanceSummary,
) -> str:
    """Build the user-turn prompt for opportunity detection."""

    products_text = "\n".join(
        f"- [{p.id}] {p.name} | {p.category} | ₹{p.price_inr} | {p.season} | "
        f"{p.inventory_status.value} | Views: {p.views:,} | Sales: {p.sales:,}"
        for p in products
    )

    # Include last 15 posts to fit context window comfortably
    recent_posts = posts[:15]
    posts_text = "\n".join(
        f"- [{p.format}] {p.category} | Audience: {p.audience} | "
        f"Objective: {p.objective} | ER: {p.engagement_rate:.1f}% | "
        f"Caption: \"{p.caption[:80]}...\""
        for p in recent_posts
    )

    format_perf_text = "\n".join(
        f"  • {fp.format}: {fp.avg_engagement_rate:.1f}% avg ER ({fp.post_count} posts)"
        for fp in performance.by_format
    )

    audience_perf_text = "\n".join(
        f"  • {ap.audience}: {ap.avg_engagement_rate:.1f}% avg ER ({ap.post_count} posts)"
        for ap in performance.by_audience
    )

    return f"""
BRAND:
  Name: {brand.name}
  Description: {brand.description}
  Tone: {", ".join(brand.tone)}
  Target Audience: {brand.audience.age_range}, {brand.audience.location}
  Interests: {", ".join(brand.audience.interests)}
  Active Campaign: {brand.campaign}

PRODUCT CATALOG:
{products_text}

HISTORICAL PERFORMANCE SUMMARY:
  Brand average engagement rate: {performance.brand_avg_engagement_rate:.1f}%
  Total posts analysed: {performance.total_posts}
  Top performing format: {performance.top_performing_format}
  Top performing audience: {performance.top_performing_audience}

  By Format:
{format_perf_text}

  By Audience:
{audience_perf_text}

RECENT POSTS (last {len(recent_posts)}):
{posts_text}

TASK:
Based on all the above data, identify 3–4 specific content opportunities
for {brand.name} this week. Prioritise opportunities with strong data evidence.
Avoid repeating formats or products unless there is a compelling reason.
Return valid JSON only.
""".strip()


def build_content_generator_system_prompt(brand: Brand) -> str:
    """CO-STAR system prompt for the AI Content Generator."""
    return f"""
You are a D2C social media copywriter specialising in Indian men's fashion content.
You write copy that feels authentic, confident, and brand-aligned — never generic or promotional.

CONTEXT:
You are generating content for {brand.name}, a modern Indian men's D2C fashion brand.
Brand tone: {", ".join(brand.tone)}.
Active campaign: {brand.campaign}.

OBJECTIVE:
Generate platform-specific social content for a specific, pre-validated content opportunity.
The creative direction, audience, and objective have already been decided by the content strategist.
Your job is to produce the final copy — slides, caption, CTA, and hashtags.

STYLE:
- Specific and direct, never vague
- Copy feels native to the platform, not like a press release
- Each slide headline is punchy (max 8 words)
- Caption is conversational, not promotional
- Do NOT invent product features, discounts, or statistics not provided
- Do NOT use generic clichés like "elevate your style" or "step up your game"

TONE: {", ".join(brand.tone)}

AUDIENCE:
Young Indian men aged 18–30 who are fashion-conscious, mobile-first, and value authenticity.

RESPONSE FORMAT:
Return ONLY a valid JSON object conforming exactly to this schema.
Do NOT include markdown fences or any text outside the JSON.

{{
  "slides": [
    {{
      "slide_number": 1,
      "headline": "Hook slide headline (max 8 words, bold, attention-grabbing)",
      "body": "Supporting line for slide 1 (1–2 sentences)",
      "visual_cue": "Brief art direction note for the visual (e.g. 'Model in sage linen shirt, outdoor minimal background')"
    }},
    {{
      "slide_number": 2,
      "headline": "Slide 2 headline",
      "body": "Slide 2 body copy",
      "visual_cue": "Visual direction"
    }},
    {{
      "slide_number": 3,
      "headline": "Slide 3 headline",
      "body": "Slide 3 body copy",
      "visual_cue": "Visual direction"
    }},
    {{
      "slide_number": 4,
      "headline": "CTA slide headline",
      "body": "Final call-to-action body copy",
      "visual_cue": "Visual direction for the CTA slide"
    }}
  ],
  "caption": "Full Instagram caption (2–4 lines, conversational, ends with question or soft CTA)",
  "cta": "Short call-to-action text (e.g. 'Shop now — link in bio 🔗')",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8"]
}}
""".strip()


def build_content_generator_user_prompt(
    opportunity: Opportunity,
    product: Product,
    request: GenerateContentRequest,
    brand: Brand,
) -> str:
    """Build the user-turn prompt for content generation."""
    return f"""
CONTENT OPPORTUNITY:
  Title: {opportunity.title}
  Content Angle: {opportunity.content_angle}
  Why this opportunity: {opportunity.why}

PRODUCT:
  Name: {product.name}
  Category: {product.category}
  Price: ₹{product.price_inr}
  Description: {product.description}
  Key Features: {", ".join(product.features)}
  Season: {product.season}

GENERATION PARAMETERS:
  Platform: {request.platform.value}
  Format: {request.format.value}
  Target Audience: {request.audience}
  Objective: {request.objective}
  Brand Tone: {", ".join(brand.tone)}

Generate the Instagram Carousel content now. Return valid JSON only.
""".strip()
