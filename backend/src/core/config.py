from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    APP_NAME: str = "CodeScan AI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"
    
    # LLM Settings
    ANTHROPIC_API_KEY: str
    LLM_MODEL: str = "claude-sonnet-4-20250514"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/codescan"
    
    # Redis Cache & Rate Limiting
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # GitHub Integration
    GITHUB_TOKEN: str = ""
    
    # Performance
    MAX_CONCURRENT_REQUESTS: int = 100
    TIMEOUT_SECONDS: int = 30
    MAX_FILE_SIZE_MB: int = 10
    
    # Monitoring
    PROMETHEUS_PORT: int = 9090
    LOG_LEVEL: str = "INFO"
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "https://*.vercel.app"]
    
    # Analysis Settings
    INCREMENTAL_SCAN_ENABLED: bool = True
    SCAN_TIMEOUT_SECONDS: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings() -> Settings:
    return Settings()
