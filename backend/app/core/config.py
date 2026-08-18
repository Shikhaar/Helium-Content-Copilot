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

    # AI provider (OpenAI or OpenRouter)
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    openai_base_url: str = ""
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
    def effective_api_key(self) -> str:
        """Return either OpenRouter or OpenAI API key."""
        return self.openrouter_api_key.strip() or self.openai_api_key.strip()

    @property
    def effective_base_url(self) -> str | None:
        """Return base URL if using OpenRouter or custom endpoint."""
        if self.openai_base_url.strip():
            return self.openai_base_url.strip()
        if self.openrouter_api_key.strip() or self.openai_api_key.startswith("sk-or-"):
            return "https://openrouter.ai/api/v1"
        return None

    @property
    def effective_model(self) -> str:
        """Return model name formatted for the provider."""
        if self.effective_base_url and "openrouter" in self.effective_base_url:
            if not ("/" in self.openai_model):
                return f"openai/{self.openai_model}"
        return self.openai_model

    @property
    def ai_enabled(self) -> bool:
        """True when a valid OpenAI or OpenRouter API key is configured."""
        key = self.effective_api_key
        return bool(key and (key.startswith("sk-") or key.startswith("sk-or-")))


settings = Settings()
