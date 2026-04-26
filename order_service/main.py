from fastapi import FastAPI
from contextlib import asynccontextmanager
from db.db import Base, engine

from api.api_orders import router as orders_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Orders Service", lifespan=lifespan)

app.include_router(orders_router)


@app.get("/health")
def health():
    return {"status": "ok"}