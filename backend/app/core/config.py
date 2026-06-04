from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ZHIPUAI_API_KEY: str = "your_api_key_here"
    ZHIPU_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4"
    ZHIPU_MODEL: str = "glm-4-flash"

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    ALLOWED_ORIGINS: str = "*"

    CHROMA_PERSIST_DIR: str = "app/data/chroma"
    SQLITE_PATH: str = "app/data/production.db"
    FORECAST_MODEL_PATH: str = "app/data/forecast_model.json"
    QUERY_LOG_PATH: str = "app/data/query_logs.json"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
