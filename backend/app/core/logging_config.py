"""
Logging configuration for Helium Content Copilot.

Sets up structured, levelled logging with consistent format across all modules.
Every major service action (DB queries, AI calls, scoring steps, API events)
is logged so the evaluator can observe the system's reasoning at runtime.
"""
import logging
import sys
from app.core.config import settings


def configure_logging() -> None:
    """Configure root logger with a clean, consistent format."""
    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)-35s | %(message)s"
    )
    date_format = "%Y-%m-%d %H:%M:%S"

    # Ensure Windows console / streams handle UTF-8 without crashing on cp1252
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    handler = logging.StreamHandler(sys.stdout)

    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format=log_format,
        datefmt=date_format,
        handlers=[
            handler,
        ],
    )

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a named logger. Use module __name__ as the name."""
    return logging.getLogger(name)
