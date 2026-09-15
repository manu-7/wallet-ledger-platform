from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",env_file_encoding="utf-8")
    
    DATABASE_URL:str
    REDIS_URL:str
    
    JWT_SECRET:str
    JWT_ALGORITHM:str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5500,http://localhost:5173"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

settings = Settings()
