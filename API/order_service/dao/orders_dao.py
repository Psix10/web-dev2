import random

from decimal import Decimal
from uuid import uuid4

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.order_models import Cart, CartItem, Order, OrderItem, OrderStatus
from schemas.order_schemas import CartItemCreate, CartItemUpdate, OrderCreate
from models.address_models import UserAddress

PRODUCT_SERVICE_URL = "http://product_service:8001/api/products"


class OrdersDAO:
    def __init__(self, session: AsyncSession):
        self.session = session

    def _generate_order_number(self) -> str:
        return f"ORD-{uuid4().hex[:10].upper()}"

    async def _get_product_snapshot(self, product_id: int) -> dict:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{PRODUCT_SERVICE_URL}/{product_id}")

        if response.status_code == 404:
            raise ValueError("Product not found")
        if response.status_code != 200:
            raise ValueError("Product service unavailable")

        data = response.json()
        return {
            "id": data["id"],
            "name": data["name"],
            "price": Decimal(str(data["price"])),
        }

    def _calculate_cart_total(self, cart: Cart) -> Decimal:
        return sum(
            (item.price_snapshot * item.quantity for item in cart.items),
            start=Decimal("0.00"),
        )

    async def _refresh_cart_total(self, cart: Cart) -> None:
        cart.total_amount = self._calculate_cart_total(cart)
        await self.session.flush()

    async def get_cart_by_session_id(self, session_id: str) -> Cart | None:
        stmt = (
            select(Cart)
            .where(Cart.session_id == session_id)
            .options(selectinload(Cart.items))
        )
        return await self.session.scalar(stmt)
    
    async def _get_user_profile(self, user_id: int) -> dict | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user: User | None = result.scalar_one_or_none()
        if user is None:
            return None

        return {
            "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
            "phone": user.phone,      
            "email": user.email,      
        }

    async def get_or_create_cart(self, session_id: str, user_id: int | None = None) -> Cart:
        cart = await self.get_cart_by_session_id(session_id)
        if cart:
            # при логине можно здесь привязать user_id к существующей гостевой корзине
            if user_id and cart.user_id is None:
                cart.user_id = user_id
                await self.session.flush()
            return cart

        cart = Cart(
            session_id=session_id,
            user_id=user_id,
            total_amount=Decimal("0.00"),
        )
        self.session.add(cart)
        await self.session.flush()
        return cart

    async def add_item_to_cart(self, payload: CartItemCreate, session_id: str, user_id: int | None = None) -> CartItem:
        cart = await self.get_or_create_cart(session_id, user_id=user_id)

        stmt = select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == payload.product_id,
        )
        existing = await self.session.scalar(stmt)

        if existing:
            existing.quantity += payload.quantity
            await self.session.flush()
            await self.session.refresh(cart, ["items"])
            await self._refresh_cart_total(cart)
            return existing

        product = await self._get_product_snapshot(payload.product_id)

        item = CartItem(
            cart_id=cart.id,
            product_id=product["id"],
            product_name_snapshot=product["name"],
            price_snapshot=product["price"],
            quantity=payload.quantity,
        )
        self.session.add(item)
        await self.session.flush()

        await self.session.refresh(cart, ["items"])
        await self._refresh_cart_total(cart)
        return item

    async def get_cart_item(self, item_id: int) -> CartItem | None:
        return await self.session.get(CartItem, item_id)

    async def update_cart_item(self, item: CartItem, payload: CartItemUpdate) -> CartItem:
        item.quantity = payload.quantity
        await self.session.flush()

        cart = await self.session.get(
            Cart,
            item.cart_id,
            options=(selectinload(Cart.items),),
        )
        if cart:
            await self._refresh_cart_total(cart)

        return item

    async def delete_cart_item(self, item: CartItem) -> None:
        cart = await self.session.get(
            Cart,
            item.cart_id,
            options=(selectinload(Cart.items),),
        )

        await self.session.delete(item)
        await self.session.flush()

        if cart:
            await self.session.refresh(cart, ["items"])
            await self._refresh_cart_total(cart)


    async def create_order_from_cart(self, payload: OrderCreate, user_id: int | None = None):
        if not payload.items:
            raise ValueError("Order must contain at least one item")

        total = sum(
            item.price_snapshot * item.quantity
            for item in payload.items
        )

        order = Order(
            order_number=self._generate_order_number(),
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            customer_email=payload.customer_email,
            delivery_address=payload.delivery_address,
            comment=payload.comment,
            user_id=user_id,
            total_amount=total,
            status=OrderStatus.NEW,
        )

        self.session.add(order)
        await self.session.flush()

        for item_data in payload.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data.product_id,
                product_name_snapshot=item_data.product_name_snapshot,
                price_snapshot=item_data.price_snapshot,
                quantity=item_data.quantity,
            )
            self.session.add(order_item)

        await self.session.flush()
        await self.session.refresh(order)
        return order

    async def get_order_by_id(self, order_id: int) -> Order | None:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        return await self.session.scalar(stmt)

    async def list_orders(self, status: OrderStatus | None = None) -> list[Order]:
        stmt = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
        if status is not None:
            stmt = stmt.where(Order.status == status)

        result = await self.session.scalars(stmt)
        return list(result.all())

    async def update_order_status(self, order: Order, status: OrderStatus) -> Order:
        order.status = status
        await self.session.flush()
        return order
    
    async def _get_user_address(self, user_id: int, address_id: int) -> UserAddress | None:
        result = await self.session.execute(
            select(UserAddress).where(
                UserAddress.id == address_id,
                UserAddress.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
    
    async def list_orders_by_user_id(self, user_id: int) -> list[Order]:
        stmt = (
            select(Order)
            .where(Order.user_id == user_id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())