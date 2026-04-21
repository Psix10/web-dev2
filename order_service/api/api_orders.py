from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from order_service.dao.orders_dao import OrdersDAO
from order_service.db.db import get_session
from order_service.models.order_models import OrderStatus
from order_service.schemas.order_schemas import (
    CartItemCreate,
    CartItemUpdate,
    CartRead,
    CartItemMutationResponse,
    OrderCreate,
    OrderRead,
    OrderMutationResponse,
    OrderStatusUpdate,
)

router = APIRouter(prefix="/api", tags=["orders"])


@router.post("/cart/items", response_model=CartItemMutationResponse, status_code=status.HTTP_201_CREATED)
def add_cart_item(
    payload: CartItemCreate,
    sessionId: str = Query(..., alias="sessionId"),
    db: Session = Depends(get_session),
):
    dao = OrdersDAO(db)
    try:
        item = dao.add_item_to_cart(payload, sessionId)
        db.commit()
        return {"id": item.id, "message": "Item added to cart"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/cart/{session_id}", response_model=CartRead)
def get_cart(session_id: str, db: Session = Depends(get_session)):
    dao = OrdersDAO(db)
    cart = dao.get_cart_by_session_id(session_id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    return cart


@router.put("/cart/items/{item_id}", response_model=CartItemMutationResponse)
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    db: Session = Depends(get_session),
):
    dao = OrdersDAO(db)
    item = dao.get_cart_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    dao.update_cart_item(item, payload)
    db.commit()
    return {"id": item.id, "message": "Cart item updated"}


@router.delete("/cart/items/{item_id}", response_model=CartItemMutationResponse)
def delete_cart_item(item_id: int, db: Session = Depends(get_session)):
    dao = OrdersDAO(db)
    item = dao.get_cart_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    dao.delete_cart_item(item)
    db.commit()
    return {"id": item_id, "message": "Cart item deleted"}


@router.post("/orders", response_model=OrderMutationResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_session)):
    dao = OrdersDAO(db)
    try:
        order = dao.create_order_from_cart(payload)
        db.commit()
        return {
            "id": order.id,
            "order_number": order.order_number,
            "message": "Order created",
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_session)):
    dao = OrdersDAO(db)
    order = dao.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/admin/orders", response_model=list[OrderRead])
def get_admin_orders(
    status_value: OrderStatus | None = Query(None, alias="status"),
    db: Session = Depends(get_session),
):
    dao = OrdersDAO(db)
    return dao.list_orders(status=status_value)


@router.patch("/admin/orders/{order_id}/status", response_model=OrderMutationResponse)
def patch_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_session),
):
    dao = OrdersDAO(db)
    order = dao.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    dao.update_order_status(order, payload.status)
    db.commit()
    return {
        "id": order.id,
        "order_number": order.order_number,
        "message": "Order status updated",
    }