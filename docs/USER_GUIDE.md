# Helium Content Copilot — User Guide

Welcome to the **Helium Content Copilot** user guide. This walkthrough explains how D2C brand marketers and content strategists use Helium to discover high-yield content opportunities, generate production-ready social assets, and manage their editorial calendar.

---

## Quick Start (30-Second Overview)

You can explore the application live without installing anything:
**[Live App: helium-content-copilot.onrender.com](https://helium-content-copilot.onrender.com)**

`	ext
Opportunities Tab       ──►  Inspect 5 Signals & Score  ──►  Generate in Studio
(Ranked Recommendations)       (Why this matters)             (Multi-Frame Storyboard)
                                                                     │
                                                                     ▼
Brand & Catalog Tab     ◄──  Scheduled in Calendar      ◄──  Approve & Schedule
(Tone & Products)              (Algorithmic Best-Time)        (Inline Copy Edit)
`

---

## 1. Discovering Opportunities (Opportunities Tab)

The primary entry point helps you answer: **" What should we create next — and why?\**

### Steps:
1. **Analyze Brand Context:**
 - Click the purple **\Find Content Opportunities\** (or **\Re-analyze Brand Data\**) button.
 - The engine analyzes current catalog velocity, historical post performance, audience signals, seasonality, and campaign objectives.
2. **Review Top Opportunities:**
 - The copilot returns ranked opportunities (e.g., *Korean Minimalist Styling Guide*, *Airport Look Essentials*).
 - Each opportunity displays:
 - **Deterministic Score (0–100):** Calculated from 5 weighted factors.
 - **Confidence Tag:** High, Good, or Moderate.
 - **Metadata Pills:** Format (Carousel, Reel, Static), Platform (Instagram, LinkedIn), and Target Audience.
3. **Deep-Dive into Evidence:**
 - Click on any opportunity card to open the **Opportunity Detail** view.
 - Inspect the **5-Signal Report Card**:
 - **Historical Signal:** Average format engagement vs. brand baseline.
 - **Product Signal:** Inventory status, price point, and margins.
 - **Audience Signal:** Demographic alignment and search trends.
 - **Seasonal Signal:** Calendar alignment (e.g., Summer 2026).
 - **Business Objective:** Conversion, awareness, or engagement fit.

---

## 2. Generating & Editing in Content Studio (Content Studio Tab)

Once an opportunity is selected, turn it into structured, production-ready creative in seconds.

### Steps:
1. **Generate Content:**
 - Click **\Generate Content\** from the opportunity detail page.
 - The AI Strategist creates a structured multi-frame storyboard matching the format (e.g., 5-slide Instagram Carousel or 4-scene Reel script).
2. **Review Multi-Frame Visual Mockup:**
 - Click through the **Storyboard Frames** at the bottom to inspect each scene.
 - Each scene includes:
 - **Scene Role:** (Hook / Pain Point / Product Hero / Detail / Call-to-Action).
 - **Visual Cue:** Photographic art direction for photographers/designers.
 - **On-Screen Copy:** Clean text layout for maximum viewer retention.
3. **Inline Customization:**
 - **Edit Scene Text:** Click **\Edit Scene\** to modify headlines, body copy, or visual prompts.
 - **Edit Caption & CTA:** Click **\Edit Caption\** to rewrite the post caption or call-to-action.
 - **Manage Hashtags:** Click **\Edit Tags\** to customize or platform-normalize hashtags.
4. **AI Regeneration:**
 - Want a different creative angle? Click **\Regenerate\** to produce fresh copy while maintaining brand voice and product accuracy.

---

## 3. Approval & Algorithmic Scheduling (Calendar Tab)

Helium closes the loop by turning approved drafts into a calendar timeline.

### Steps:
1. **Approve Content:**
 - Click **\Approve Draft\** in Content Studio. The status badge turns green (✓ Approved).
2. **Smart Scheduling Recommendation:**
 - Click **\Schedule Post\**.
 - Helium recommends the **optimal posting window** based on historical audience peak times (e.g., Thursday 7:00 PM for streetwear engagement).
 - You can accept the recommended time or pick a custom date and time.
3. **Interactive Editorial Calendar:**
 - Open the **Calendar** tab from the sidebar.
 - View scheduled, approved, and published posts in a monthly grid.
 - **Direct Studio Drill-Down:** Click any colored post pill on the calendar to reopen that exact draft in Content Studio for last-minute revisions.
 - **Delete/Reschedule:** Manage entries directly from the upcoming list.

---

## 4. Brand Guidelines & Catalog Management (Brand & Catalog Tab)

Helium grounds all AI reasoning in actual business constraints and inventory data.

### Steps:
1. **Edit Brand Guidelines:**
 - View active campaign name, brand tone adjectives, and demographic segments.
 - Click **\Edit Guidelines\** to update tone keywords or target audience profiles.
2. **Manage E-Commerce Catalog:**
 - Inspect existing products (SKUs, pricing, inventory stock status, categories).
 - **Add New Product:** Click **\+ Add Product\** to enter a new item (Name, Category, Price in ₹, Season, Inventory Status).
 - **Delete Product:** Remove discontinued products with 1 click.
 - *Helium automatically factors newly added or out-of-stock products into subsequent opportunity rankings!*

---

## Mobile & Desktop Navigation Features

- **Mobile Drawer (< 768px):**
 - Tap the **Hamburger menu (☰)** in the top header to slide open the navigation drawer.
 - Close it anytime with the **close button (✕)**, by tapping the dimmed background overlay, or by choosing any tab.
- **Desktop Collapse Mode (≥ 768px):**
 - Click **\Collapse\** at the bottom of the sidebar to shrink it into a compact **68px icon rail**, expanding your workspace canvas.
 - Click **\Expand\** to restore full text labels anytime.

---

## Frequently Asked Questions

<details>
<summary><strong>Do I need an OpenAI API key to test the app?</strong></summary>

No. Helium includes a **deterministic zero-config fallback engine**. If no API key is provided, Helium uses pre-calibrated mathematical scoring and realistic demo generation so all features work out-of-the-box.
</details>

<details>
<summary><strong>How are the opportunity scores calculated?</strong></summary>

Scores are computed using a deterministic 100-point formula:
\text{Score} = \text{Historical (25)} + \text{Product Velocity (25)} + \text{Audience (20)} + \text{Seasonality (15)} + \text{Objective (15)}
Full details and mathematical formulas are available in [docs/SCORING_MODEL.md](SCORING_MODEL.md).
</details>

<details>
<summary><strong>Can I export or connect this to Shopify / Instagram?</strong></summary>

Yes, our architectural roadmap for live connectors (Shopify GraphQL, Meta Graph API, Klaviyo) and multi-agent LangGraph verification is detailed in [docs/FUTURE_SCOPE_ROADMAP.md](FUTURE_SCOPE_ROADMAP.md).
</details>
