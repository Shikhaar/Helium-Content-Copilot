"""
Builds the complete backend/app/data/seed_data.py file cleanly with proper UTF-8 encoding.
"""
import json
from pathlib import Path
from dataset_builder import ALL_PRODUCTS, ALL_POSTS

# Read the top brands and initial opportunities from seed_data.py
seed_path = Path(__file__).parent / "seed_data.py"

# Clean any surrogate pairs in ALL_POSTS and ALL_PRODUCTS
def clean_obj(obj):
    if isinstance(obj, str):
        return obj.encode('utf-8', 'ignore').decode('utf-8')
    elif isinstance(obj, list):
        return [clean_obj(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: clean_obj(v) for k, v in obj.items()}
    return obj

clean_products = clean_obj(ALL_PRODUCTS)
clean_posts = clean_obj(ALL_POSTS)

# Read original BRANDS and INITIAL_OPPORTUNITIES
brands_code = """BRANDS = [
    {
        "id": "snitch",
        "workspace_id": "default_workspace",
        "name": "SNITCH",
        "description": (
            "SNITCH is a modern Indian men's D2C fashion brand known for bold, "
            "trend-forward clothing. Designed for the confident, style-conscious "
            "young man in urban India who refuses to compromise between looking "
            "good and spending smart."
        ),
        "tone": json.dumps(["Bold", "Confident", "Minimal", "Relatable", "Trend-First", "Aspirational"]),
        "audience": json.dumps({
            "age_range": "18–30",
            "location": "India (Tier 1 & 2 cities)",
            "interests": ["Streetwear", "Styling", "Korean fashion silhouettes", "Travel", "Fitness"],
            "shopping_behavior": [
                "Mobile-first shoppers",
                "Price-conscious but quality-aware",
                "Heavily influenced by Instagram & Reels",
                "Look for outfit inspiration and styling guides",
            ],
        }),
        "campaign": "Summer 2026",
    },
    {
        "id": "blissclub",
        "workspace_id": "default_workspace",
        "name": "BLISSCLUB",
        "description": (
            "BLISSCLUB designs exceptionally comfortable, functional activewear "
            "and lifestyle apparel engineered specifically for Indian women of all shapes and sizes."
        ),
        "tone": json.dumps(["Empowering", "Comfort-First", "Inclusive", "Joyful", "Practical"]),
        "audience": json.dumps({
            "age_range": "22–40",
            "location": "Pan-India",
            "interests": ["Movement", "Yoga", "Work-from-anywhere comfort", "Travel", "Wellness"],
            "shopping_behavior": [
                "Seek deep pockets and functional design",
                "Value fabric softness and durability",
                "Engage with relatable fit trials",
            ],
        }),
        "campaign": "Move in Freedom",
    },
    {
        "id": "souled_store",
        "workspace_id": "default_workspace",
        "name": "THE SOULED STORE",
        "description": (
            "THE SOULED STORE is India's premier fandom and casual pop-culture brand, "
            "offering officially licensed merchandise, oversized tees, and urban street staples."
        ),
        "tone": json.dumps(["Playful", "Youthful", "Expressive", "Passionate", "Community-Driven"]),
        "audience": json.dumps({
            "age_range": "16–28",
            "location": "Metro & Tier 1/2 Cities",
            "interests": ["Anime", "Marvel/DC", "Gaming", "Streetwear", "Sneakers"],
            "shopping_behavior": [
                "Collector mentality for limited drops",
                "Love graphic heavy oversized silhouettes",
                "Active on community polls & drop hype",
            ],
        }),
        "campaign": "Fandom Street Drop",
    },
]"""

# Read INITIAL_OPPORTUNITIES from earlier
with open(seed_path, "r", encoding="utf-8", errors="ignore") as f:
    cur = f.read()

opps_idx = cur.find("INITIAL_OPPORTUNITIES = [")
opps_code = cur[opps_idx:]

products_code = "PRODUCTS = " + json.dumps(clean_products, indent=4, ensure_ascii=False)
posts_code = "HISTORICAL_POSTS = " + json.dumps(clean_posts, indent=4, ensure_ascii=False)

new_seed_content = f'''"""
Seed data — Synthetic multi-brand datasets for BrandBrew.

IMPORTANT DISCLAIMER:
  This dataset contains fictional, synthetic representations inspired by the
  aesthetic and product styles of modern Indian D2C brands:
    1. SNITCH (Men's fast fashion / streetwear · Summer 2026)
    2. BLISSCLUB (Women's activewear & movement apparel · Move in Freedom)
    3. THE SOULED STORE (Pop culture & streetwear casuals · Fandom Street Drop)

  It is created solely for demonstration purposes and is NOT affiliated with,
  endorsed by, or representative of the actual brands or their live metrics.
"""
from __future__ import annotations

import json
from app.core.logging_config import get_logger

logger = get_logger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# 1. BRANDS
# ──────────────────────────────────────────────────────────────────────────────

{brands_code}

# ──────────────────────────────────────────────────────────────────────────────
# 2. PRODUCTS ({len(clean_products)} total across 3 brands)
# ──────────────────────────────────────────────────────────────────────────────

{products_code}

# ──────────────────────────────────────────────────────────────────────────────
# 3. HISTORICAL POSTS ({len(clean_posts)} total across 3 brands)
# ──────────────────────────────────────────────────────────────────────────────

{posts_code}

# ──────────────────────────────────────────────────────────────────────────────
# 4. INITIAL REPRESENTATIVE PRE-SCORED OPPORTUNITIES
# ──────────────────────────────────────────────────────────────────────────────

{opps_code}
'''

with open(seed_path, "w", encoding="utf-8") as f:
    f.write(new_seed_content)

print(f"Successfully generated clean seed_data.py with {len(clean_products)} products and {len(clean_posts)} posts!")
