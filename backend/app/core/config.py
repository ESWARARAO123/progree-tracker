from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sierra Team Hub API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-key-change-in-production-123456789"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "seai123"
    POSTGRES_DB: str = "daily_tracker"
    POSTGRES_PORT: str = "5432"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Email Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "notifications@company.com"
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "notifications@company.com"
    EMAILS_FROM_NAME: str = "Sierra Team Hub"
    
    COMPANY_EMAIL_DOMAIN: str = "@sierraedge.ai"
    
    class Config:
        case_sensitive = True

settings = Settings()
