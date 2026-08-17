"""
SQLite database initialisation and connection management.

Uses aiosqlite for async access. The database is created on first startup
and seeded with SNITCH-inspired demo data if tables are empty.
"""
import aiosqlite
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

CREATE_TABLES_SQL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS brand (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    tone        TEXT NOT NULL,       -- JSON array of tone keywords
    audience    TEXT NOT NULL,       -- JSON object
    campaign    TEXT NOT NULL        -- active campaign name e.g. "Summer 2026"
);

CREATE TABLE IF NOT EXISTS products (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL,
    price_inr        INTEGER NOT NULL,
    description      TEXT NOT NULL,
    features         TEXT NOT NULL,  -- JSON array
    season           TEXT NOT NULL,
    target_audience  TEXT NOT NULL,
    inventory_status TEXT NOT NULL,
    views            INTEGER NOT NULL DEFAULT 0,
    sales            INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historical_posts (
    id              TEXT PRIMARY KEY,
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
    draft_id    TEXT REFERENCES content_drafts(id),
    title       TEXT NOT NULL,
    platform    TEXT NOT NULL,
    format      TEXT NOT NULL,
    status      TEXT NOT NULL,
    scheduled_datetime TEXT NOT NULL
);
"""


async def get_db() -> aiosqlite.Connection:
    """Open and return an aiosqlite connection with row_factory set."""
    db = await aiosqlite.connect(settings.database_url)
    db.row_factory = aiosqlite.Row
    return db


async def init_db() -> None:
    """Create tables if they do not exist."""
    logger.info("Initialising database at %s", settings.database_url)
    async with aiosqlite.connect(settings.database_url) as db:
        await db.executescript(CREATE_TABLES_SQL)
        await db.commit()
    logger.info("Database schema ready")
