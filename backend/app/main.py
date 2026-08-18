"""
Helium Content Copilot — FastAPI application entry point.
"""
from contextlib import asynccontextmanager

import aiosqlite
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.database import init_db, get_db
from app.core.logging_config import configure_logging, get_logger
from app.data.seed_data import seed_database

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialise DB schema and seed data."""
    logger.info("=" * 60)
    logger.info("Starting Helium Content Copilot")
    logger.info("AI Enabled: %s", settings.ai_enabled)
    logger.info("Database: %s", settings.database_url)
    logger.info("=" * 60)

    await init_db()

    async with aiosqlite.connect(settings.database_url) as db:
        db.row_factory = aiosqlite.Row
        await seed_database(db)
        if settings.ai_enabled:
            await db.execute("DELETE FROM opportunities WHERE is_demo = 1")
            await db.commit()

    logger.info("Startup complete — ready to serve requests")
    yield
    logger.info("Shutting down Helium Content Copilot")


app = FastAPI(
    title="Helium Content Copilot",
    description="AI-powered content opportunity and generation tool for D2C brands",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
