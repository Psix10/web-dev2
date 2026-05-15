from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.db import get_session
from dao.orders_dao import OrdersDAO
from schemas.order_schemas import OrderRead
from services.order_service import current_user

user_router = APIRouter(
    prefix="/api/orders",
    tags=["user-orders"],
    dependencies=[Depends(current_user)],
)


@user_router.get(
    "/me",
    response_model=list[OrderRead],
    response_model_by_alias=True,
)
async def get_my_orders(
    user=Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    orders = await dao.list_orders_by_user_id(user["id"])
    return orders