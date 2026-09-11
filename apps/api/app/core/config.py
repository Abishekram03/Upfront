import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Userly Analytics API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Defaults to local SQLite async DB, or PostgreSQL in production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./userly_prod.db")
    
    # Secret salt used for privacy-safe daily visitor hashing
    HASH_SALT: str = os.getenv("HASH_SALT", "userly_super_privacy_salt_2026_xyz")
    
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
