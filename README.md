# Helium Content Copilot

> ## Turn brand data into content worth creating.

**Helium Content Copilot** is an AI-powered content strategist for D2C brands that identifies high-value content opportunities, explains why they matter, and turns them into ready-to-review social content.

🚀 **[Live App Demo](https://helium-content-copilot.onrender.com)** · [Architecture](docs/ARCHITECTURE.md) · [Scoring Model](docs/SCORING_MODEL.md) · [AI Prompts](docs/AI_PROMPTS.md) · [Product Thinking](docs/PRODUCT_THINKING.md) · [Roadmap](docs/FUTURE_SCOPE_ROADMAP.md)

---

> [!NOTE]
> **Dataset Note:**  
> This MVP uses a synthetic demo dataset inspired by the product categories, pricing, and visual style of [SNITCH](https://snitch.co.in/) (an Indian men's fashion D2C brand). It is an independent prototype and is **not affiliated with, endorsed by, or representative of SNITCH or its actual business metrics**.

---

## The Problem

Most AI content tools start with:
> **"What should I write?"**

Helium starts one step earlier:
> **"What is actually worth creating — and why?"**

For D2C marketers, generating another caption is easy. Deciding **which product, audience, format, and content angle deserves creative effort** is harder.

Helium combines **Brand Context + Product Velocity + Historical Performance + Audience Signals + Seasonality + Business Objectives** to identify the strongest content opportunities.

---

## The Core Workflow

```text
Brand Context & Data
        ↓
Opportunity Detection
        ↓
"Why This Opportunity?" (5-Signal Evidence)
        ↓
Deterministic 100-Point Score
        ↓
AI Content Generation (Platform-Specific Studio)
        ↓
Human Review & Inline Scene Editing
        ↓
Approve & Schedule to Calendar
```

> **The key product decision:**  
> AI does not decide the numerical score. The scoring engine calculates recommendations deterministically in Python. The LLM handles qualitative reasoning and content generation.  
> **AI interprets. Application logic calculates.**

---

## Product Walkthrough

| Step | Core Screen | Description | Visual |
| :--- | :--- | :--- | :---: |
| **01 — Discover** | **Opportunities Hub** | Live-ranked recommendations grounded in catalog demand and brand baseline | [ View Screenshot](docs/screenshots/dashboard.png) |
| **02 — Evaluate** | **"Why This Opportunity?"** | 5-signal evidence breakdown & deterministic score gauge (Decision Screen) | [ View Screenshot](docs/screenshots/opportunity.png) |
| **03 — Create & Edit** | **AI Content Studio** | Platform-tailored copy, lifestyle visual mockups, and inline scene editor | [ View Screenshot](docs/screenshots/content_studio.png) |
| **04 — Schedule** | **Publishing Calendar** | Weekly interactive schedule with confirmed time slots | [ View Screenshot](docs/screenshots/calendar.png) |

---

## What Makes It Different

### 1. Opportunity Before Generation
```text
Brand Data + Signals  →  Opportunity  →  Why Reasoning  →  Content
```
This changes AI from a copywriting utility into a **decision-support system for marketers**.

### 2. Deterministic Opportunity Scoring
Every opportunity is evaluated across five deterministic signals:

| Signal | Max Points | Evaluation Method |
| :--- | :---: | :--- |
| **Historical Performance** | 25 | Engagement rate ratio vs brand feed baseline |
| **Product Relevance & Stock** | 25 | Catalog demand index (views & sales) $\times$ stock multiplier |
| **Audience Fit** | 20 | Target audience ER vs median audience benchmark |
| **Seasonal Alignment** | 15 | Discrete lookup against active campaign season |
| **Business Objective Fit** | 15 | Format efficiency ratio for the target goal |
| **Total** | **100** | **Sum of all 5 factors** |

👉 [Read the full scoring formulas and math derivations](docs/SCORING_MODEL.md)

### 3. "Why This Opportunity?" — The Core Decision Screen
Every recommendation has an evidence-backed explanation. The marketer can see:

```text
WHY THIS OPPORTUNITY? *(Illustrative example from calibrated benchmark demo)*
─────────────────────────────────────────────────────────────────────────────
Historical Performance       24 / 25  (8.2% ER vs 4.8% baseline · 1.71×)
Product Relevance            20 / 25  (8,400 views · 410 sales · In Stock)
Audience Fit                 18 / 20  (Young Millennial match)
Seasonal Alignment           15 / 15  (Summer 2026 campaign)
Business Objective           15 / 15  (High-velocity discovery format)
─────────────────────────────────────────────────────────────────────────────
TOTAL OPPORTUNITY SCORE      92 / 100
```

Alongside the score, the UI explains the underlying signals in plain marketing language:
- *"Styling content has historically outperformed the brand average by 1.71×."*
- *"The recommended product is one of the strongest performers in the catalog and fully in stock."*
- *"The target audience has shown stronger engagement with outfit inspiration."*

This makes the recommendation **defensible in a marketing meeting**, rather than simply *"AI-generated."*

### 4. AI Content Studio & Storyboard Frames
Once an opportunity is selected, Helium turns the strategy into platform-specific content with rich visual frame mockups:
- **Slide / Scene 1:** The Hook (*0:00 - 0:03*)
- **Slide / Scene 2:** Fabric & Story (*0:03 - 0:07*)
- **Slide / Scene 3:** Styling & Fit (*0:07 - 0:11*)
- **Slide / Scene 4:** Call to Action (*0:11 - 0:15*)
- **Caption & CTA:** Conversational copy with CTA buttons
- **Dynamic Scheduling:** Algorithmically recommends optimal posting slots based on audience demographics (*e.g., Today 7:30 PM IST*)

### 5. Human-in-the-Loop
```text
AI Recommendation  →  AI Generation  →  Human Review & Edit  →  Approve  →  Schedule
```
The system assists creative decisions; it does not silently publish on behalf of the marketer.

---

## Product Decisions

### Why opportunity-first?
Generating content is cheap. Choosing what deserves creative effort is harder.

### Why deterministic scoring?
A marketer should be able to understand and reproduce why an opportunity received its score.

### Why human approval?
The system assists creative decisions; it does not silently publish on behalf of the marketer.

### Why synthetic data?
Real brand performance data was unavailable for the assignment, so I created a transparent synthetic dataset rather than presenting fabricated metrics as real business data.

---

## AI Architecture

```text
                    Brand + Historical Data
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
          Analytics Engine         AI Strategist
                 │                       │
                 │                 Qualitative
                 │                  reasoning
                 ▼                       │
          Scoring Engine                 │
          Deterministic                  │
             Math                        │
                 │                       │
                 └───────────┬───────────┘
                             ▼
                        Opportunity
                             │
                             ▼
                      Content Generator
                             │
                             ▼
                    Human Review & Edit
                             │
                             ▼
                     Approve & Schedule
```

---

## Evaluation

| Component | Result | Notes |
| :--- | :---: | :--- |
| **Backend Test Suite** | **35 / 35 passed** | 100% pass rate in `pytest` (0.35s) |
| **Scoring Boundary Tests** | **Passed** | Factor bounds (0–25, 0–20, 0–15) and stock multipliers verified |
| **Pydantic Validation Tests** | **Passed** | Strict JSON schema validation for all requests and responses |
| **Opportunity Ranking Tests** | **Passed** | Opportunities reliably sorted by deterministic total score |
| **AI Fallback Reliability** | **Passed** | Calibrated fallback executes seamlessly when LLM API key is absent |
| **Frontend Production Build** | **Clean** | 0 TypeScript / SSR compilation errors |

---

## Tech Stack

- **Backend:** Python 3.11+ / FastAPI / SQLite (`aiosqlite`) / Poetry / Pydantic v2
- **Frontend:** Next.js (Turbopack) / React 19 / TypeScript / Lucide Icons / Vanilla CSS
- **AI Engine:** OpenAI (`gpt-4o-mini`) / OpenRouter + CO-STAR structured prompting + JSON mode validation
- **Testing:** `pytest` + `pytest-asyncio` (35 unit tests)

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
