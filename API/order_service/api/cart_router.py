from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.db import get_session
from dao.orders_dao import OrdersDAO
from schemas.order_schemas import (
    CartItemCreate,
    CartItemUpdate,
    CartRead,
    CartItemMutationResponse,
    OrderCreate,
    OrderMutationResponse,
)
from services.order_service import optional_current_user

cart_router = APIRouter(prefix="/api", tags=["cart"])


@cart_router.post(
    "/cart/items",
    response_model=CartItemMutationResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def add_cart_item(
    payload: CartItemCreate,
    sessionId: str = Query(..., alias="sessionId"),
    current_user=Depends(optional_current_user),
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    user_id = current_user["id"] if current_user else None
    try:
        item = await dao.add_item_to_cart(payload, sessionId, user_id=user_id)
        await db.commit()
        return {"id": item.id, "message": "Item added to cart"}
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@cart_router.get(
    "/cart/{sessionId}",
    response_model=CartRead,
    response_model_by_alias=True,
)
async def get_cart(sessionId: str, db: AsyncSession = Depends(get_session)):
    dao = OrdersDAO(db)
    cart = await dao.get_cart_by_session_id(sessionId)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    return cart


@cart_router.put(
    "/cart/items/{itemId}",
    response_model=CartItemMutationResponse,
    response_model_by_alias=True,
)
async def update_cart_item(
    itemId: int,
    payload: CartItemUpdate,
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    try:
        item = await dao.get_cart_item(itemId)
        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        await dao.update_cart_item(item, payload)
        await db.commit()
        return {"id": item.id, "message": "Cart item updated"}
    except HTTPException:
        await db.rollback()
        raise
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@cart_router.delete(
    "/cart/items/{itemId}",
    response_model=CartItemMutationResponse,
    response_model_by_alias=True,
)
async def delete_cart_item(itemId: int, db: AsyncSession = Depends(get_session)):
    dao = OrdersDAO(db)
    try:
        item = await dao.get_cart_item(itemId)
        if not item:
            raise HTTPException(status_code=404, detail="Cart item not found")

        await dao.delete_cart_item(item)
        await db.commit()
        return {"id": itemId, "message": "Cart item deleted"}
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@cart_router.post(
    "/orders",
    response_model=OrderMutationResponse,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    payload: OrderCreate,
    current_user=Depends(optional_current_user),
    db: AsyncSession = Depends(get_session),
):
    dao = OrdersDAO(db)
    user_id = current_user["id"] if current_user else None

    try:
        order = await dao.create_order_from_cart(payload, user_id=user_id)
        await db.commit()
        return {
            "id": order.id,
            "orderNumber": order.order_number,
            "message": "Order created",
        }
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))