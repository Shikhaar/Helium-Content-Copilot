# Helium Content Copilot

> **Know what to post. Know why. Create it in seconds.**  
> An AI-powered content opportunity detection and generation platform for D2C brands.

---
> [!NOTE]
> **Synthetic Data Disclaimer:**  
> This project uses a synthetic demo dataset inspired by the aesthetic, tone, and product style of [SNITCH](https://snitch.co.in/) (a modern Indian men's fashion D2C brand). This project is an independent conceptual prototype and is **not affiliated with, endorsed by, or representative of SNITCH or its actual business metrics**.

---
## The Core Philosophy

Most AI marketing tools ask: *"What should the AI write?"*  
**Helium Content Copilot** asks: *"What content is actually worth creating — and why?"*

Instead of blindly churning out copy, Helium analyzes historical post performance, product catalog velocity, seasonal campaign alignment, and audience receptivity to surface **high-conviction content opportunities** backed by explainable data.

---
## Key Features

1. **Deterministic 5-Factor Scoring Engine:**
   - Evaluates every recommendation across **Historical Performance (/25)**, **Product Relevance (/25)**, **Audience Fit (/20)**, **Seasonal Alignment (/15)**, and **Business Objective Fit (/15)** for a total of **100 points**.
   - Math is computed strictly in Python — zero LLM hallucination in numeric metrics.

2. **The "Why" Hero Screen:**
   - Every opportunity presents a 5-signal evidence breakdown and animated score gauge so marketing managers can defend creative decisions with data.

3. **CO-STAR AI Content Studio:**
   - Platform-tailored copy generation (Carousel slides, conversational captions, visual art direction briefs, and curated hashtags).
   - In-app inline editing, approval workflow, and scheduling.

4. **Linear Workflow UX:**
   - Opinionated flow: `Dashboard → Opportunity → Why Breakdown → Generate → Edit → Approve → Schedule → Calendar`.

5. **Zero-Config Demo Mode:**
   - Works out-of-the-box with live OpenAI integration or seamless fallback to deterministic demo responses.

---
## Tech Stack & Architecture

- **Backend:** Python 3.11+ / FastAPI / SQLite (`aiosqlite`) / Poetry / Pydantic v2
- **Frontend:** Next.js 16 (App Router) / TypeScript / Tailwind CSS / Lucide Icons
- **AI & Prompts:** OpenAI (`gpt-4o-mini`) + CO-STAR Prompt Engineering Framework + strict JSON mode schemas
- **Testing:** `pytest` / `pytest-asyncio` (35 unit tests covering arithmetic, scoring ranges, boundary conditions, and Pydantic schemas)

---
## Quickstart Guide

### Prerequisites
- Python 3.11+ and [Poetry](https://python-poetry.org/)
- Node.js 18+ and `npm`

---
### 1. Start the Backend

```bash
cd backend

# Install dependencies via Poetry
poetry install

# (Optional) Add your OpenAI API key for live AI generation:
# cp .env.example .env
# edit .env -> OPENAI_API_KEY=sk-...

# Run test suite (35 tests)
poetry run pytest tests/ -v

# Start FastAPI server (runs on http://localhost:8000)
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---
### 2. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---
## Documentation

Detailed documentation is available in the [`docs/`](./docs) directory:

- [**Product Thinking & Philosophy**](./docs/PRODUCT_THINKING.md) — The problem statement, differentiators, and UX principles.
- [**Technical Architecture**](./docs/ARCHITECTURE.md) — System design, data flow, and repository layer patterns.
- [**Scoring Model & Formulas**](./docs/SCORING_MODEL.md) — Complete mathematical derivations, constants, and the 92/100 hero score walkthrough.
- [**AI Prompts & CO-STAR Framework**](./docs/AI_PROMPTS.md) — System and user prompts with schema validation rules.
- [**Interview & Demo Script**](./docs/INTERVIEW_DEMO_SCRIPT.md) — 3-minute live walkthrough script and anticipated questions.

---
## License

MIT License. Built for the Helium AI Product Engineer Assignment.
