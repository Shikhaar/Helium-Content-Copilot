# BrandBrew — Architecture & Authentication Documentation

## Overview

BrandBrew is an AI-powered Content Copilot for D2C brands. It delivers high-impact social content opportunities using a deterministic 2-Stage Recommendation Engine (Candidate Generation ? 5-Factor Scoring) and generates multi-slide carousel drafts, captions, and calendar schedules.

---

## 1. Authentication & Security Boundary

BrandBrew uses **Clerk** as its exclusive authentication provider. The backend enforces security boundaries on all requests.

```
Clerk Frontend SDK
      ? (Bearer JWT in Authorization header)
FastAPI Backend (app/api/routes.py)
      ?
get_current_user() Dependency (app/services/auth_service.py)
      ? (RSA Verification via Clerk JWKS)
UserContext (clerk_user_id, email, name, workspace_id)
      ?
verify_brand_access(brand_id, user, BrandRepository)
      ? (Workspace Tenancy Verification)
Brand-Scoped Operations
      ? (Explicit brand_id query parameters)
Supabase PostgreSQL / SQLite Database
```

### Authorization Rules:
1. **Unauthenticated Requests**: Any request without a valid Clerk JWT returns `401 Unauthorized`.
2. **Brand Isolation**: A user can only access brands that belong to their workspace. Cross-workspace access returns `403 Forbidden`.
3. **Single-User Workspace**: Seeded brands and initial users share the `'default_workspace'`, providing full access in single-tenant/single-user deployments without complexity.
4. **No RBAC**: Role-based access control (RBAC), custom roles, and team membership invitations are intentionally deferred. The architecture maintains a clean user-to-workspace-to-brand hierarchy that allows RBAC to be added in the future without schema overhauls.

---

## 2. Multi-Brand Data Isolation

Every domain model is strictly scoped by `brand_id`:

- **Brands**: `brands` table (`id`, `workspace_id`, `name`, `tone`, `audience`, `campaign`)
- **Products**: `products` table (`brand_id REFERENCES brands(id) ON DELETE CASCADE`)
- **Historical Posts**: `historical_posts` table (`brand_id REFERENCES brands(id) ON DELETE CASCADE`)
- **Opportunities**: `opportunities` table (`brand_id REFERENCES brands(id) ON DELETE CASCADE`)
- **Content Drafts**: `content_drafts` table (`brand_id REFERENCES brands(id) ON DELETE CASCADE`)
- **Editorial Calendar**: `calendar_entries` table (`brand_id REFERENCES brands(id) ON DELETE CASCADE`)

All repository methods (`BrandRepository`, `ProductRepository`, `OpportunityRepository`, `ContentRepository`, `CalendarRepository`, `PostRepository`) mandate `brand_id` scoping on writes and lookups.

Cascade deletion is enforced in SQLite and PostgreSQL (`PRAGMA foreign_keys = ON` / `ON DELETE CASCADE`). Deleting a brand safely purges all associated products, posts, opportunities, drafts, and calendar entries.

---

## 3. Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Clerk Next.js SDK, Lucide Icons, Vanilla CSS
- **Backend**: FastAPI, Python 3.11, Pydantic v2, PyJWT (JWKS cryptographic verification)
- **Database**: Supabase PostgreSQL (production) / aiosqlite (local dev & testing)
- **AI Providers**: OpenAI / OpenRouter (LLM Strategist & Creative Generation)
