"""
Application configuration loaded from environment variables via pydantic-settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # AI provider
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Database
    database_url: str = "./helium.db"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    frontend_origin: str = "http://localhost:3000"

    # Logging
    log_level: str = "INFO"

    @property
    def ai_enabled(self) -> bool:
        """True when a real API key is configured."""
        return bool(self.openai_api_key and self.openai_api_key.startswith("sk-"))


settings = Settings()
