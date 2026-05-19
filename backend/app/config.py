from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://kamik:kamik@localhost:5433/kamik"
    cors_origins: str = "http://localhost:5173"
    secret_key: str = "kamik-dev-secret-key"

    class Config:
        env_file = ".env"


settings = Settings()
