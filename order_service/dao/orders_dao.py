from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from order_service.models.order_models import Cart, CartItem, Order, OrderItem, OrderStatus
from order_service.schemas.order_schemas import (
    CartItemCreate,
    CartItemUpdate,
    OrderCreate,
)


class OrdersDAO:
    def __init__(self, session: Session):
        self.session = session

    def _generate_order_number(self) -> str:
        return f"ORD-{uuid4().hex[:10].upper()}"

    def get_cart_by_session_id(self, session_id: str) -> Cart | None:
        stmt = (
            select(Cart)
            .where(Cart.session_id == session_id)
            .options(selectinload(Cart.items))
        )
        return self.session.scalar(stmt)

    def get_or_create_cart(self, session_id: str) -> Cart:
        cart = self.get_cart_by_session_id(session_id)
        if cart:
            return cart

        cart = Cart(session_id=session_id)
        self.session.add(cart)
        self.session.flush()
        return cart

    def add_item_to_cart(self, payload: CartItemCreate, session_id: str) -> CartItem:
        cart = self.get_or_create_cart(session_id)

        stmt = select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == payload.product_id,
        )
        existing = self.session.scalar(stmt)

        if existing:
            existing.quantity += payload.quantity
            return existing

        item = CartItem(
            cart_id=cart.id,
            product_id=payload.product_id,
            product_name_snapshot=payload.product_name_snapshot,
            price_snapshot=payload.price_snapshot,
            quantity=payload.quantity,
        )
        self.session.add(item)
        self.session.flush()
        return item

    def get_cart_item(self, item_id: int) -> CartItem | None:
        return self.session.get(CartItem, item_id)

    def update_cart_item(self, item: CartItem, payload: CartItemUpdate) -> CartItem:
        item.quantity = payload.quantity
        return item

    def delete_cart_item(self, item: CartItem) -> None:
        self.session.delete(item)

    def create_order_from_cart(self, payload: OrderCreate) -> Order:
        cart = self.get_cart_by_session_id(payload.session_id)
        if not cart or not cart.items:
            raise ValueError("Cart is empty or not found")

        total_amount = sum(
            (item.price_snapshot * item.quantity for item in cart.items),
            start=Decimal("0.00"),
        )

        order = Order(
            order_number=self._generate_order_number(),
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            customer_email=payload.customer_email,
            delivery_address=payload.delivery_address,
            comment=payload.comment,
            total_amount=total_amount,
            status=OrderStatus.NEW,
        )
        self.session.add(order)
        self.session.flush()

        for item in cart.items:
            self.session.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item.product_id,
                    product_name_snapshot=item.product_name_snapshot,
                    price_snapshot=item.price_snapshot,
                    quantity=item.quantity,
                    line_total=item.price_snapshot * item.quantity,
                )
            )

        return order

    def get_order_by_id(self, order_id: int) -> Order | None:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        return self.session.scalar(stmt)

    def list_orders(self, status: OrderStatus | None = None) -> list[Order]:
        stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
        if status is not None:
            stmt = stmt.where(Order.status == status)
        return list(self.session.scalars(stmt).all())

    def update_order_status(self, order: Order, status: OrderStatus) -> Order:
        order.status = status
        return order