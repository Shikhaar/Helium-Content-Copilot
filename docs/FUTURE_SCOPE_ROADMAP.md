# BrandBrew — Future Architecture & Production Scaling Roadmap

## 1. Executive Summary

BrandBrew is an AI-powered D2C marketing intelligence platform designed to answer the core strategic question for modern ecommerce brands:
> **"What content should we create next — and why?"**

In this iteration (`feature/production-architecture`), BrandBrew implements a **production-oriented architecture**:
- **Authentication**: Cryptographic Clerk JWT authentication & workspace tenancy.
- **Persistence**: Relational PostgreSQL with Supabase, managed via synchronous/async SQLAlchemy and Alembic schema migrations.
- **Multi-Tenant Scoping**: Strict brand-scoped isolation at the API and repository layers.
- **Two-Stage Recommendation Pipeline**:
  - **Stage 1 (Candidate Generation)**: Heuristic candidate generation across Product $\times$ Format $\times$ Audience matrix ($O(N)$ bounded seeds).
  - **Stage 2 (Deterministic Scoring)**: 5-factor mathematical scoring engine ($0–100$) evaluating Historical ER, Product Relevance, Audience Fit, Seasonality, and Objective Multipliers.
  - **Stage 3 (AI Enrichment)**: Strategic copy generation and human reasoning without non-deterministic score generation.
- **Persistent Opportunity Storage**: Dashboard reads directly from PostgreSQL ($<50\text{ ms}$), completely decoupling UI latency from LLM generation.

This roadmap documents the architectural expansion plan for when BrandBrew scales beyond initial brand cohorts to enterprise scale (thousands of brands, millions of social metrics).

---

## 2. Target Scaling Milestones

```
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│     PHASE 1 (CURRENT)   │     │    PHASE 2 (GROWTH)     │     │   PHASE 3 (ENTERPRISE)  │
│  5 - 50 Brands          │     │  50 - 5,000 Brands      │     │  5,000+ Brands          │
│  FastAPI + Supabase     │ ──> │  Async Workers + Redis  │ ──> │  Distributed Pipeline   │
│  2-Stage In-Process     │     │  Celery / ARQ Jobs      │     │  Kafka + pgvector       │
│  Alembic Migrations     │     │  Real Meta Graph APIs   │     │  Event-Driven Streaming │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

---

## 3. Phase 2: Growth Scaling (50 – 5,000 Brands)

### 3.1 Distributed Background Task Queue (Celery / ARQ + Redis)
- **Current State**: Opportunity analysis runs asynchronously in FastAPI request lifecycle and persists to PostgreSQL.
- **Future Scale**:
  - Offload heavy recommendation analysis and image rendering pipelines to dedicated worker pools (`Celery` or `arq` with Redis).
  - Webhook-triggered batch analysis: run nightly rolling aggregations at 02:00 UTC per tenant.
  - Rate limiting & exponential backoff for external LLM endpoints (Gemini / Anthropic / OpenAI).

```
   FastAPI Gateway ──(Enqueue Job)──> Redis Queue ──> Celery Worker Pool
          │                                                  │
          ▼                                                  ▼
     PostgreSQL <────────────────(Persist Scored Opps)───────┘
```

### 3.2 Live Social Ingestion (Meta Graph API & Shopify Webhooks)
- **Instagram / Facebook Graph API**:
  - Scheduled OAuth token refresh for Brand social accounts.
  - Ingestion of live impressions, reach, saves, comments, shares, video 3-second views, retention curves.
- **Shopify / WooCommerce Webhooks**:
  - Real-time catalog sync: inventory status updates (`In Stock` $\to$ `Low Stock` $\to$ `Out of Stock`), new SKU releases, and real-time revenue velocity.

### 3.3 Semantic Search & Vector Embeddings (`pgvector`)
- Store embeddings for all historical captions, hook variations, and creative concepts.
- **Creative Deduplication**: Automatically detect and penalize repetitive creative angles that the brand has posted within the past 30 days.
- **Competitor Benchmark Clustering**: Vector similarity search over anonymized high-performing industry benchmarks.

---

## 4. Phase 3: Enterprise Distributed Infrastructure (5,000+ Brands)

### 4.1 Event-Driven Telemetry (Apache Kafka / AWS Kinesis)
- Decouple social event collection (clickstream, attribution pixels, engagement webhooks) into partitioned Kafka topics:
  - `brandbrew.telemetry.social-events`
  - `brandbrew.telemetry.ecommerce-conversions`
- Stream processors (Apache Flink / Spark Streaming) computing real-time rolling 7-day and 30-day engagement rate moving averages per format and product category.

### 4.2 Database Sharding & Read Replicas
- Tenant-partitioned PostgreSQL tables (`PARTITION BY LIST (workspace_id)`).
- Dedicated read replicas for analytics queries and dashboard lookups; primary instance dedicated to write-heavy ingestion and transactional content scheduling.
- Redis multi-level caching for brand guidelines and catalog lookups ($<5\text{ ms}$ response).

### 4.3 Multi-Model Orchestration & Fallback Routing
- **Hybrid LLM Gateway**:
  - High-throughput / Low-latency models (e.g. Gemini 2.5 Flash / Claude 3.5 Haiku) for bulk candidate filtering and hashtag generation.
  - Frontier models (Claude 3.7 Sonnet / GPT-4o) for high-stakes creative hook scripting and carousel narrative structure.
  - Local quantized models (e.g., Llama 3 on vLLM) for cost-sensitive on-premise deployments.

---

## 5. Summary of Architecture Decision Matrix

| Dimension | MVP / Current Phase | Growth Phase | Enterprise Scale |
| :--- | :--- | :--- | :--- |
| **Auth & Tenancy** | Clerk JWT + Brand Scoping | Clerk B2B Orgs + RBAC | Enterprise SSO (SAML/Okta) + Fine-grained ABAC |
| **Persistence** | Supabase Postgres + SQLite tests | Supabase Postgres + Read Replicas | Sharded Postgres + pgvector + Redis Cache |
| **Recommendation Engine** | In-process 2-Stage (Candidate Gen + Math Scoring) | Async Worker Pool (Celery + Redis) | Real-time Stream Analytics (Flink + Kafka) |
| **AI Strategist** | LLM Strategic Copywriting + Deterministic Math | LLM with Semantic Vector Memory | Multi-Model Routing + Fine-Tuned Domain Adapters |
| **Social Data** | Synthetic Seed & Brand CSV Imports | Live Meta / Shopify Webhooks | Real-Time Telemetry Stream Processing |
