from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager


from api.auth_router import router as admin_auth_router
from api.api_admin import router as admin_router


from db.db import init_models, async_session
from services.admin_seed import seed_admin_data, seed_rbac

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_models()

    async with async_session() as session:
        await seed_rbac(session)

    await seed_admin_data()

    yield



app = FastAPI(title="Admin Service", lifespan=lifespan)

app.include_router(admin_auth_router)
app.include_router(admin_router)


@app.get("/health")
def health():
    return {"status": "ok"}