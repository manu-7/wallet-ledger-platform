from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",env_file_encoding="utf-8")
    
    DATABASE_URL:str
    REDIS_URL:str
    
    JWT_SECRET:str
    JWT_ALGORITHM:str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
settings = Settings()