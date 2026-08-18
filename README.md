# Helium Content Copilot

> **Turn brand data into content worth creating.**
>
> An AI-native content strategist for D2C brands that identifies high-value content opportunities, explains why they matter, and turns them into ready-to-review social content.

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js-000000)](https://nextjs.org/)
[![AI](https://img.shields.io/badge/AI-OpenAI%20%2F%20OpenRouter-412991)](https://openai.com/)
[![Tests](https://img.shields.io/badge/Tests-35%20passing-brightgreen)](#testing)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

---

## Why I Built This

Most AI content tools start with:
> **"What should I write?"**

Helium Content Copilot starts one step earlier:
> **"What is actually worth creating — and why?"**

For a D2C marketing team, generating another caption is rarely the hardest problem. The harder problem is **deciding which product, audience, format, and content angle deserves attention**.

Helium analyzes brand context, product signals, historical content performance, audience behavior, seasonality, and business objectives to surface the strongest content opportunities.

The workflow is intentionally:

```text
Brand Context & Catalog
        ↓
Historical Performance Analysis
        ↓
AI Content Strategist (CO-STAR Reasoning)
        ↓
Ranked Content Opportunities
        ↓
"Why this?" (5-Signal Evidence Breakdown)
        ↓
Deterministic Opportunity Score (0–100)
        ↓
AI Content Generation (Platform-Specific Studio)
        ↓
Human Review & Inline Scene Editing
        ↓
Approve & Schedule to Calendar
```

The product does not ask AI to generate content blindly.  
**It first helps the marketer decide what content is worth creating.**

---

## The Product

### "What should this brand post next?"
The dashboard surfaces the strongest content opportunities for the brand.

For example:
```text
┌─────────────────────────────────────────────────────────┐
│ 3 Ways to Style the Oversized Linen Shirt               │
│                                                         │
│ Instagram · Reel / Carousel · Product Discovery         │
│                                                         │
│ Opportunity Score                                       │
│ 92 / 100                                                │
│                                                         │
│ Styling content has historically generated              │
│ significantly higher engagement for this brand.         │
│                                                         │
│ [ Why this? ] [ Create content ]                        │
└─────────────────────────────────────────────────────────┘
```

Instead of returning generic prompts like:
- *"Create educational content"*
- *"Post social proof"*
- *"Create a product post"*

The system produces **specific, actionable opportunities grounded in the brand's data**.

---

## What Makes It Different

### 1. Opportunity Before Generation
Traditional AI content workflows often look like:
```text
Prompt  →  Caption
```
Helium uses:
```text
Brand Data + Signals  →  Opportunity  →  Why Reasoning  →  Content
```
This changes AI from a copywriting utility into a **decision-support system for marketers**.

### 2. Deterministic Opportunity Scoring
**The AI does not decide the numerical score.**

Every opportunity is evaluated across five deterministic signals:

| Signal | Max Points | Evaluation Method |
| :--- | :---: | :--- |
| **Historical Performance** | 25 | Engagement rate ratio vs brand feed baseline |
| **Product Relevance & Stock** | 25 | Catalog demand index (views & sales) $\times$ stock multiplier |
| **Audience Fit** | 20 | Target audience ER vs median audience benchmark |
| **Seasonal Alignment** | 15 | Discrete lookup against active campaign season |
| **Business Objective Fit** | 15 | Format efficiency ratio for the target goal |
| **Total** | **100** | **Sum of all 5 factors** |

The score is calculated entirely in Python from the underlying dataset. The LLM provides qualitative reasoning.

```text
       AI
       │ Qualitative reasoning
       ▼
┌─────────────┐
│ Opportunity │
└──────┬──────┘
       │
       ▼
 Scoring Engine
       │ Deterministic Math
       ▼
   92 / 100
```

> **AI interprets. Application logic calculates.**  
> This makes recommendations reproducible, testable, and explainable.

👉 [Read the full scoring model & formulas](docs/SCORING_MODEL.md)

### 3. "Why This Opportunity?" (The Star Screen)
Every recommendation has an evidence-backed explanation. The marketer can see:

```text
WHY THIS OPPORTUNITY?
─────────────────────────────────────────────────
Historical Performance       24 / 25  (8.2% ER vs 4.8% baseline)
Product Relevance            20 / 25  (8,400 views · In Stock)
Audience Fit                 18 / 20  (Young Millennial match)
Seasonal Alignment           15 / 15  (Summer 2026 campaign)
Business Objective           15 / 15  (Strong discovery format)
─────────────────────────────────────────────────
TOTAL SCORE                  92 / 100
```

Alongside the score, the UI explains the underlying signals in plain marketing language:
- *"Styling content has historically outperformed the brand average by 1.71×."*
- *"The recommended product is one of the strongest performers in the catalog and fully in stock."*
- *"The target audience has shown stronger engagement with outfit inspiration."*

This makes the recommendation **defensible in a marketing meeting**, rather than simply *"AI-generated."*

### 4. AI Content Studio
Once an opportunity is selected, Helium turns the strategy into platform-specific content with rich visual frame mockups:
- **Slide / Scene 1:** The Hook (*0:00 - 0:03*)
- **Slide / Scene 2:** Fabric & Story (*0:03 - 0:07*)
- **Slide / Scene 3:** Styling & Fit (*0:07 - 0:11*)
- **Slide / Scene 4:** Call to Action (*0:11 - 0:15*)
- **Caption & CTA:** Conversational copy with CTA buttons
- **Hashtags:** Platform-normalized hashtags
- **Dynamic Scheduling:** Algorithmically recommends the best posting slot (*e.g., Today 7:30 PM IST*)

The marketer can:
- Edit generated headlines, narration scripts, or visual cues directly
- Edit captions, CTAs, and hashtags inline
- Regenerate content
- Approve before scheduling

### 5. Human-in-the-Loop
```text
AI Recommendation  →  AI Generation  →  Human Review & Edit  →  Approve  →  Schedule
```
The goal is not to remove the marketer from the process. The goal is to give the marketer a **better starting point and defensible decision support**.

---

## Product Workflow

1. **Discover:** The system analyzes brand context and historical data.
2. **Evaluate:** Marketer reviews ranked opportunities with scores.
3. **Understand:** *"Why this opportunity?"* provides the 5-signal evidence and score breakdown.
4. **Create:** Generate platform-specific content in the studio.
5. **Review & Edit:** Edit slide headlines, captions, CTAs, or scene cues.
6. **Approve:** Marketer explicitly approves the content.
7. **Schedule:** The approved post is queued for publication.
8. **Calendar:** Scheduled content appears in the interactive weekly calendar.

---

## AI Architecture

```text
┌───────────────────┐
│   Brand Context   │
└─────────┬─────────┘
          │
┌─────────▼─────────┘
│ Historical Posts  │
│  & Performance    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Analytics Engine  │
│                   │
│ Engagement rates  │
│   Aggregations    │
└─────────┬─────────┘
          │
     ┌────┴───────────────────────────┐
     │                                │
     ▼                                ▼
┌─────────────────┐          ┌─────────────────┐
│ Scoring Engine  │          │  AI Strategist  │
│                 │          │                 │
│  Deterministic  │          │     CO-STAR     │
│  5-factor math  │          │    reasoning    │
└────────┬────────┘          └────────┬────────┘
         │                            │
         └─────────────┬──────────────┘
                       ▼
          ┌───────────────────┐
          │    Opportunity    │
          │  Recommendation   │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Content Generator │
          │                   │
          │ Platform + Format │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Human Review/Edit │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Approval/Schedule │
          └─────────┬─────────┘
```

---

## Evaluation & Test Metrics

| Metric | Result | Notes |
| :--- | :--- | :--- |
| **Backend Test Suite** | **35 / 35 passed** | 100% pass rate in `pytest` (0.35s) |
| **Scoring Formula Coverage** | **100%** | All 5 factors, ranges, bounds & multipliers tested |
| **Pydantic Schema Validation** | **100%** | Strict JSON response & request validation |
| **AI Fallback Reliability** | **100%** | Zero-crash fallback when LLM API is unavailable |
| **Frontend Production Build** | **Clean** | 0 TypeScript / SSR compilation errors |

---

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI / SQLite (`aiosqlite`) / Poetry / Pydantic v2
- **Frontend:** Next.js (Turbopack) / React 19 / TypeScript / Lucide Icons / Vanilla CSS
- **AI Engine:** OpenAI (`gpt-4o-mini`) / OpenRouter + CO-STAR structured prompting + JSON mode validation
- **Testing:** `pytest` + `pytest-asyncio` (35 unit tests)

---

## Data

The MVP uses a synthetic demo dataset inspired by the visual style and product categories of **SNITCH**, an Indian men's fashion D2C brand.

> [!NOTE]
> **Synthetic Demo Disclaimer:**  
> This project is independently built and is not affiliated with, endorsed by, or representative of SNITCH or its actual business metrics.

The synthetic dataset contains:
- **8 representative products** (with views, sales, prices, inventory status, and seasons)
- **25 historical social posts** (impressions, likes, comments, shares, saves, formats, and audiences)
- **Brand guidelines** (active campaign, tone of voice, and audience demographics)

The data is designed so that recommendations emerge from **measurable signals rather than hardcoded outputs**.

---

## Engineering Decisions

| Decision | Trade-Off & Rationale |
| :--- | :--- |
| **Why SQLite?** | The product requires persistence and transactions, but not distributed cluster infrastructure. SQLite provides durability and zero-config portability for evaluators. |
| **Why Deterministic Scoring?** | Marketing recommendations should be explainable and reproducible. The LLM is better suited to creative synthesis than inventing numerical metrics. |
| **Why No RAG?** | The dataset is structured and fits in memory. Introducing vector databases or embeddings would add operational complexity without improving retrieval quality. |
| **Why No Autonomous Publishing?** | Publishing marketing copy is a brand-sensitive action. The MVP enforces human review, inline editing, and explicit approval before scheduling. |
| **Why Simulated Publishing?** | Real social platform integrations would shift engineering effort toward OAuth tokens and Meta App reviews rather than solving the core product challenge: **deciding what content is worth creating**. |

---

## Quick Start

### Prerequisites
- Python 3.11+ and [Poetry](https://python-poetry.org/)
- Node.js 18+ and `npm`

### 1. Backend Setup
```bash
cd backend
poetry install

# Run backend tests (35 passing)
poetry run pytest tests/ -v

# Start FastAPI server (runs on http://localhost:8000)
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

*(Optional: Add `OPENROUTER_API_KEY` or `OPENAI_API_KEY` in `backend/.env` for live LLM generation. Without an API key, the system automatically uses calibrated fallback responses).*

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation

-  [Architecture Overview](docs/ARCHITECTURE.md)
-  [Scoring Model & Mathematical Derivations](docs/SCORING_MODEL.md)
-  [AI Prompts & CO-STAR Framework](docs/AI_PROMPTS.md)
-  [Product Thinking & Strategy](docs/PRODUCT_THINKING.md)
-  [Future Scope & Architectural Roadmap](docs/FUTURE_SCOPE_ROADMAP.md)

---

## License

MIT License. Built as an independent prototype for the Helium AI Product Engineer take-home assignment.
