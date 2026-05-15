from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "api-gateway"
    APP_VERSION: str = "1.0.0"

    PRODUCT_SERVICE_URL: str = "http://127.0.0.1:8001"
    ORDER_SERVICE_URL: str = "http://127.0.0.1:8002"
    ADMIN_SERVICE_URL: str = "http://127.0.0.1:8003"
    AUTH_SERVICE_URL: str = "http://127.0.0.1:8004"

    ADMIN_JWT_SECRET_KEY: str = "admin-secret"
    USER_JWT_SECRET_KEY: str = "user-secret"
    JWT_ALGORITHM: str = "HS256"

    GATEWAY_TIMEOUT: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()