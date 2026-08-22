"""
Database initialisation and connection management for BrandBrew.

Supports:
  - Supabase PostgreSQL (via asyncpg / PostgreSQL URL in production)
  - SQLite (via aiosqlite in local development / CI test environments)
  - Automatic migration from legacy single-tenant schema to multi-tenant schema
"""
import aiosqlite
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS brands (
    id          TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL DEFAULT 'default_workspace',
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    tone        TEXT NOT NULL,       -- JSON array of tone keywords
    audience    TEXT NOT NULL,       -- JSON object
    campaign    TEXT NOT NULL,       -- active campaign name e.g. "Summer 2026"
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
    id               TEXT PRIMARY KEY,
    brand_id         TEXT NOT NULL DEFAULT 'snitch' REFERENCES brands(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL,
    price_inr        INTEGER NOT NULL,
    description      TEXT NOT NULL,
    features         TEXT NOT NULL,  -- JSON array
    season           TEXT NOT NULL,
    target_audience  TEXT NOT NULL,
    inventory_status TEXT NOT NULL,
    views            INTEGER NOT NULL DEFAULT 0,
    sales            INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS historical_posts (
    id              TEXT PRIMARY KEY,
    brand_id        TEXT NOT NULL DEFAULT 'snitch' REFERENCES brands(id) ON DELETE CASCADE,
    platform        TEXT NOT NULL,
    format          TEXT NOT NULL,
    caption         TEXT NOT NULL,
    product_id      TEXT REFERENCES products(id),
    category        TEXT NOT NULL,
    audience        TEXT NOT NULL,
    objective       TEXT NOT NULL,
    posted_date     TEXT NOT NULL,
    impressions     INTEGER NOT NULL DEFAULT 0,
    likes           INTEGER NOT NULL DEFAULT 0,
    comments        INTEGER NOT NULL DEFAULT 0,
    shares          INTEGER NOT NULL DEFAULT 0,
    saves           INTEGER NOT NULL DEFAULT 0,
    clicks          INTEGER NOT NULL DEFAULT 0,
    conversions     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS opportunities (
    id                  TEXT PRIMARY KEY,
    brand_id            TEXT NOT NULL DEFAULT 'snitch' REFERENCES brands(id) ON DELETE CASCADE,
    analysis_run_id     TEXT,
    title               TEXT NOT NULL,
    content_angle       TEXT NOT NULL,
    audience            TEXT NOT NULL,
    objective           TEXT NOT NULL,
    platform            TEXT NOT NULL,
    format              TEXT NOT NULL,
    suggested_product_id TEXT REFERENCES products(id),
    why                 TEXT NOT NULL,
    historical_signal   TEXT NOT NULL,
    product_signal      TEXT NOT NULL,
    audience_signal     TEXT NOT NULL,
    seasonal_signal     TEXT NOT NULL,
    business_signal     TEXT NOT NULL,
    score               INTEGER NOT NULL,
    score_breakdown     TEXT NOT NULL,  -- JSON object with sub-scores
    confidence          TEXT NOT NULL,  -- "High" | "Medium" | "Low"
    confidence_reason   TEXT NOT NULL,
    created_at          TEXT NOT NULL,
    is_demo             INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS content_drafts (
    id              TEXT PRIMARY KEY,
    brand_id        TEXT NOT NULL DEFAULT 'snitch' REFERENCES brands(id) ON DELETE CASCADE,
    opportunity_id  TEXT REFERENCES opportunities(id),
    platform        TEXT NOT NULL,
    format          TEXT NOT NULL,
    audience        TEXT NOT NULL,
    objective       TEXT NOT NULL,
    slides          TEXT NOT NULL,   -- JSON array of slide objects
    caption         TEXT NOT NULL,
    cta             TEXT NOT NULL,
    hashtags        TEXT NOT NULL,   -- JSON array
    status          TEXT NOT NULL DEFAULT 'draft',  -- draft|approved|scheduled|published
    scheduled_date  TEXT,
    scheduled_time  TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    is_demo         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS calendar_entries (
    id          TEXT PRIMARY KEY,
    brand_id    TEXT NOT NULL DEFAULT 'snitch' REFERENCES brands(id) ON DELETE CASCADE,
    draft_id    TEXT REFERENCES content_drafts(id),
    title       TEXT NOT NULL,
    platform    TEXT NOT NULL,
    format      TEXT NOT NULL,
    status      TEXT NOT NULL,
    scheduled_datetime TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    avatar_url    TEXT,
    role          TEXT NOT NULL DEFAULT 'editor',
    workspace_id  TEXT NOT NULL DEFAULT 'default_workspace',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_posts_brand ON historical_posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_opps_brand_created ON opportunities(brand_id, created_at);
CREATE INDEX IF NOT EXISTS idx_drafts_brand ON content_drafts(brand_id);
CREATE INDEX IF NOT EXISTS idx_calendar_brand_datetime ON calendar_entries(brand_id, scheduled_datetime);
"""


_SQLITE_FALLBACK = "helium_dev.db"


def _resolve_db_path(url: str) -> str:
    """Resolve a database URL to an aiosqlite-compatible file path.

    PostgreSQL URLs are not supported by aiosqlite — fall back to the local
    SQLite file so the server can start in local-dev mode even when .env
    points at a Supabase instance.
    """
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "")
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        logger.info(
            "PostgreSQL DATABASE_URL detected — using local SQLite fallback '%s' for aiosqlite layer",
            _SQLITE_FALLBACK,
        )
        return _SQLITE_FALLBACK
    return url


async def get_db() -> aiosqlite.Connection:
    """Open and return a database connection with row_factory and foreign key enforcement set."""
    db_path = _resolve_db_path(settings.database_url)
    db = await aiosqlite.connect(db_path)
    db.row_factory = aiosqlite.Row
    # Enforce FK constraints including ON DELETE CASCADE
    await db.execute("PRAGMA foreign_keys = ON;")
    return db


async def init_db() -> None:
    """Initialise tables and indexes, migrating existing tables to multi-tenant schema if needed."""
    logger.info("Initialising database schema at %s", settings.database_url)
    db_path = _resolve_db_path(settings.database_url)

    async with aiosqlite.connect(db_path) as db:
        await db.execute("PRAGMA journal_mode=WAL;")

        # Check if legacy single-tenant 'brand' table exists, migrate to 'brands'
        async with db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='brand'") as cursor:
            has_old_brand = await cursor.fetchone()
        async with db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'") as cursor:
            has_new_brands = await cursor.fetchone()

        if has_old_brand and not has_new_brands:
            try:
                await db.execute("ALTER TABLE brand RENAME TO brands;")
                await db.execute("ALTER TABLE brands ADD COLUMN workspace_id TEXT NOT NULL DEFAULT 'default_workspace';")
            except Exception as e:
                logger.debug("Table migration note: %s", e)

        # Check existing tables and add brand_id column if missing from earlier runs
        tables_to_check = ["products", "historical_posts", "opportunities", "content_drafts", "calendar_entries"]
        for table in tables_to_check:
            async with db.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'") as cursor:
                table_exists = await cursor.fetchone()
            if table_exists:
                async with db.execute(f"PRAGMA table_info({table})") as cursor:
                    columns = [row[1] for row in await cursor.fetchall()]
                if "brand_id" not in columns:
                    try:
                        await db.execute(f"ALTER TABLE {table} ADD COLUMN brand_id TEXT DEFAULT 'snitch';")
                        logger.info(f"Added brand_id column to existing {table} table")
                    except Exception as e:
                        logger.warning(f"Could not add brand_id column to {table}: {e}")
                if table == "opportunities" and "analysis_run_id" not in columns:
                    try:
                        await db.execute("ALTER TABLE opportunities ADD COLUMN analysis_run_id TEXT;")
                    except Exception:
                        pass

        # Execute table creation and indexes
        await db.executescript(CREATE_TABLES_SQL)
        await db.commit()
    logger.info("Database schema ready with multi-tenant tables and indexes")
