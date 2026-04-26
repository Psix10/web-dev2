from fastapi import FastAPI
from contextlib import asynccontextmanager
from db.db import init_models

from api.api_products import router as products_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_models()
    yield

app = FastAPI(title="Product Service", lifespan=lifespan)

app.include_router(products_router)


@app.get("/health")
def health():
    return {"status": "ok"}