from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.db import get_session
from dao.orders_dao import OrdersDAO
from models.order_models import OrderStatus
from schemas.order_schemas import OrderRead,AdminOrderUpdate, OrderMutationResponse, OrderStatusUpdate
from api.dependencies import require_permissions

admin_router = APIRouter(
    prefix="/api/admin",
    tags=["admin-orders"],
)


@admin_router.get(
    "/orders",
    response_model=list[OrderRead],
    response_model_by_alias=True,
    dependencies=[Depends(require_permissions("admin:manage_orders"))],
)
async def get_admin_orders(
    status_value: OrderStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    return await dao.list_orders(status=status_value)


@admin_router.get(
    "/orders/{id}",
    response_model=OrderRead,
    response_model_by_alias=True,
    dependencies=[Depends(require_permissions("admin:manage_orders"))],
)
async def get_admin_order(
    id: int,
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    order = await dao.get_order_by_id(id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@admin_router.patch(
    "/orders/{id}/status",
    response_model=OrderMutationResponse,
    response_model_by_alias=True,
    dependencies=[Depends(require_permissions("order:update_status"))],
)
async def patch_order_status(
    id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    try:
        order = await dao.get_order_by_id(id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        await dao.update_order_status(order, payload.status)
        await db.commit()
        return {
            "id": order.id,
            "orderNumber": order.order_number,
            "message": "Order status updated",
        }
    except HTTPException:
        await db.rollback()
        raise
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.patch(
    "/orders/{order_id}",
    response_model=OrderRead,
    dependencies=[Depends(require_permissions("admin:manage_orders"))],
)
async def update_order_details(
    order_id: int,
    payload: AdminOrderUpdate,
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)

    try:
        order = await dao.update_order_by_admin(order_id, payload)
        await db.commit()
        return order
    except HTTPException:
        await db.rollback()
        raise
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))