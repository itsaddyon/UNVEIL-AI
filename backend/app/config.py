from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./unveil.db"
    explanation_provider: str = "template"
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
