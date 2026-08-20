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
            "Styling carousels are currently your highest-performing format at 8.4% average engagement. "
            "The Oversized Linen Shirt is also your highest-demand product with 14.2K views and 1,050 sales. "
            "Why it matters: It combines a proven format, strong product demand, and your active Summer 2026 campaign."
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
        headline="Beach at 4. Dinner at 8.",
        body="One shirt that handles both without missing a beat.",
        visual_cue="Model throws the sage linen shirt over a white rib tank, adjusting the cuff outdoors.",
    ),
    CarouselSlide(
        slide_number=2,
        headline="Look 01: Daytime Casual",
        body="Unbuttoned over relaxed drawstring shorts and slide sandals.",
        visual_cue="Tracking side shot of model walking through sunlit café terrace.",
    ),
    CarouselSlide(
        slide_number=3,
        headline="Look 02: Sunset Dinner",
        body="Buttoned up with pleated ecru trousers and leather mules.",
        visual_cue="Golden hour close-up on fabric texture and resort collar detail.",
    ),
    CarouselSlide(
        slide_number=4,
        headline="Save This for Packing",
        body="Which fit are you starting with this weekend?",
        visual_cue="Flatlay of styled lookbook essentials with minimalist framing.",
    ),
]

FALLBACK_CONTENT: dict[str, AIContentRaw] = {
    "default": AIContentRaw(
        slides=_STYLING_SLIDES,
        caption=(
            "One linen shirt, plenty of ways to wear it.\n\n"
            "From midday coffee runs to rooftop evenings without needing an outfit change. "
            "Which fit are you wearing?"
        ),
        cta="Discover your style — link in bio 🔗",
        hashtags=[
            "snitch", "summerstyling", "linenlayering", "menslookbook",
            "resortwear", "streetstyleindia", "summerfits",
        ],
    ),
}
