"""
Deterministic fallback data — high-fidelity demo responses for FallbackAIProvider.

Used when:
  1. No OpenAI API key is configured
  2. LLM API call fails or times out

These are hand-crafted to look exactly like what the live LLM would produce,
ensuring the recruiter demo always succeeds end-to-end.
"""
from __future__ import annotations

from app.models.schemas import AIContentRaw, AIOpportunityRaw, CarouselSlide

FALLBACK_OPPORTUNITIES: list[AIOpportunityRaw] = [
    AIOpportunityRaw(
        title="3 Ways to Style the Oversized Linen Shirt This Summer",
        content_angle="Show three distinct summer outfit combinations built around the Oversized Linen Shirt — from a casual Sunday coffee run to a smart rooftop evening look.",
        audience="Gen-Z",
        objective="Engagement + Product Discovery",
        platform="Instagram",
        format="Carousel",
        suggested_product_id="prod_001",
        why=(
            "Styling carousels have consistently been SNITCH's highest-performing content format, "
            "generating 2.5× the brand's average engagement rate. The Oversized Linen Shirt is the "
            "brand's highest-viewed summer product right now, and linen content directly aligns with "
            "the active Summer 2026 campaign. This is the clearest high-confidence opportunity of the week."
        ),
        historical_signal=(
            "Styling carousel posts for SNITCH have averaged 8.4% engagement rate "
            "vs a brand average of 3.4% — a 2.47× outperformance. Posts 1, 2, and 3 "
            "in the historical dataset all featured styling carousels and ranked in the top 5 "
            "for saves and shares."
        ),
        product_signal=(
            "The Oversized Linen Shirt leads the catalog with 14,200 views and 1,050 units sold — "
            "the highest view count of all products. It is fully in stock and actively trending "
            "within the Summer 2026 campaign window."
        ),
        audience_signal=(
            "Gen-Z audience segments have averaged 8.2% ER on SNITCH posts — significantly above "
            "the median of 4.8% across all audience segments. Styling and outfit inspiration content "
            "consistently drives the highest save rates among this segment."
        ),
        seasonal_signal=(
            "Linen is a primary fabric focus for the Summer 2026 campaign. Publishing a linen "
            "styling guide now captures peak demand before the summer sale window closes."
        ),
        business_signal=(
            "Objective is Engagement + Product Discovery — the styling carousel format has "
            "historically achieved 2.47× the brand average for this objective, making it the "
            "strongest format choice for this week."
        ),
    ),
    AIOpportunityRaw(
        title="Why 10,000+ Men Chose the Cargo Pants — Real Reviews, Real Fits",
        content_angle="Feature authentic-feeling customer perspectives and real outfit photos from buyers of the Parachute Cargo Pants, building social proof and urgency around low stock.",
        audience="Gen-Z",
        objective="Conversion",
        platform="Instagram",
        format="Carousel",
        suggested_product_id="prod_002",
        why=(
            "The Cargo Pants are the best-selling product by units (1,200 sold) but are currently "
            "Low Stock — creating urgency. Social proof carousels have generated 5.8% avg ER "
            "historically, and the low stock signal makes conversion the right objective right now."
        ),
        historical_signal=(
            "Social proof carousel posts (posts 18–20) averaged 5.8% ER with strong comment "
            "and share rates, outperforming static product posts by 2.2×."
        ),
        product_signal=(
            "Cargo Pants: 13,800 views, 1,200 sales (highest in catalog), currently Low Stock. "
            "The low inventory creates a natural urgency signal for the caption."
        ),
        audience_signal=(
            "Gen-Z audience engages strongly with community and social proof content. "
            "Posts featuring real customer fits consistently drive shares above format average."
        ),
        seasonal_signal=(
            "Cargo Pants are an all-season staple, keeping this relevant year-round. "
            "However, the low stock urgency makes publishing this week particularly timely."
        ),
        business_signal=(
            "Converting existing high-intent visitors on a nearly sold-out product "
            "is a direct revenue opportunity. Conversion is the right objective here."
        ),
    ),
    AIOpportunityRaw(
        title="How to Dress for 40°C Without Looking Like You've Given Up",
        content_angle="An educational guide addressing the specific pain point of dressing well in extreme Indian summer heat, featuring the Linen Shirt and Co-ord Set as solutions.",
        audience="Gen-Z",
        objective="Education",
        platform="Instagram",
        format="Carousel",
        suggested_product_id="prod_001",
        why=(
            "Educational carousel posts have averaged 6.2% ER for SNITCH — nearly 2× the brand "
            "average. The heat-vs-style tension is a genuine pain point for the target audience in "
            "Indian summers, and SNITCH's linen range is the perfect answer. This format builds "
            "brand authority while driving product discovery organically."
        ),
        historical_signal=(
            "Educational posts (posts 9–11) averaged 6.2% ER with notably high save rates "
            "(1.7× the static post average), indicating audiences return to this content. "
            "The summer fabric guide post generated 820 saves on 55K impressions."
        ),
        product_signal=(
            "The Linen Shirt's breathability and lightweight construction are directly relevant "
            "to the heat problem. The product description and features strongly support the "
            "educational narrative without requiring any invented claims."
        ),
        audience_signal=(
            "Gen-Z men actively seek styling and lifestyle advice on Instagram. "
            "Educational content with practical utility consistently outperforms generic product posts "
            "by 2.3× in saves — the key metric for content that drives future purchase intent."
        ),
        seasonal_signal=(
            "Peak summer temperature content is highly timely in August. "
            "This type of post has a long content lifespan as audiences save and return to it."
        ),
        business_signal=(
            "Educational content builds brand trust and positions SNITCH as a styling authority, "
            "not just a retailer. This supports long-term customer retention while driving "
            "short-term product discovery for the linen range."
        ),
    ),
]


_STYLING_SLIDES = [
    CarouselSlide(
        slide_number=1,
        headline="3 Ways to Wear Linen This Summer",
        body="One shirt. Three completely different looks. Which one are you starting with?",
        visual_cue="Clean white background. Model holds up linen shirt, facing camera. Bold text overlay.",
    ),
    CarouselSlide(
        slide_number=2,
        headline="Look 01 — The Sunday Reset",
        body="Oversized Linen Shirt + white shorts + chunky sneakers. Nothing forced, everything right.",
        visual_cue="Outdoor, natural light. Model seated at café table, relaxed posture. Sage green shirt.",
    ),
    CarouselSlide(
        slide_number=3,
        headline="Look 02 — Smart Casual Done Right",
        body="Tuck it halfway. Add pleated trousers. Suddenly you're the most put-together person in the room.",
        visual_cue="Urban setting. Model standing against textured concrete wall. Half-tuck, pleated trousers, loafers.",
    ),
    CarouselSlide(
        slide_number=4,
        headline="Look 03 — Rooftop Ready",
        body="Leave it open over a ribbed tank. Add cargo pants. The effortless rooftop fit you needed.",
        visual_cue="Golden hour rooftop. Model leaning on railing, open linen shirt over white tank, cargo pants.",
    ),
]

FALLBACK_CONTENT: dict[str, AIContentRaw] = {
    "default": AIContentRaw(
        slides=_STYLING_SLIDES,
        caption=(
            "Linen season is here and we're not letting the heat win. 🌞\n\n"
            "3 ways to style the Oversized Linen Shirt — from a lazy Sunday to a rooftop night. "
            "Which look are you going for first?\n\n"
            "Drop your number below 👇"
        ),
        cta="Shop the Linen Shirt — link in bio 🔗",
        hashtags=[
            "#SNITCH", "#SnitchStyle", "#LinenShirt", "#MensFashionIndia",
            "#IndianStreetStyle", "#SummerFits", "#OOTDIndia", "#StyleGuide",
        ],
    ),
}
