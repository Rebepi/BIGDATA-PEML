from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:Rebepi8989@localhost:5432/gasto_publico"
    environment: str = "development"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    secret_key: str = "secreto-super-seguro-gasto-publico-peru-2026-jwt"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    temp_token_expire_minutes: int = 10
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = "gastope.monitor@gmail.com"
    smtp_password: str = ""
    smtp_from: str = "gastope.monitor@gmail.com"
    admin_email: str = "renzobendezu51@gmail.com"
    resend_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip() and o.strip() != "*"]

    @property
    def sync_database_url(self) -> str:
        url = self.database_url.strip()
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url



@lru_cache()
def get_settings() -> Settings:
    return Settings()
