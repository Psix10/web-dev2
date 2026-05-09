from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field

from models.order_models import OrderStatus


# =========================
# Cart items
# =========================

class CartItemBase(BaseModel):
    product_id: int = Field(alias="productId")
    product_name_snapshot: str = Field(alias="productNameSnapshot")
    price_snapshot: Decimal = Field(alias="priceSnapshot")
    quantity: int


class CartItemCreate(BaseModel):
    product_id: int = Field(alias="productId")
    quantity: int

    model_config = ConfigDict(populate_by_name=True)


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemRead(CartItemBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    cart_id: int = Field(alias="cartId")


# =========================
# Cart
# =========================

class CartBase(BaseModel):
    session_id: str = Field(alias="sessionId")
    customer_name: str | None = Field(default=None, alias="customerName")
    customer_phone: str | None = Field(default=None, alias="customerPhone")
    customer_email: EmailStr | None = Field(default=None, alias="customerEmail")


class CartCreate(CartBase):
    model_config = ConfigDict(populate_by_name=True)
    pass


class CartUpdate(BaseModel):
    customer_name: str | None = Field(default=None, alias="customerName")
    customer_phone: str | None = Field(default=None, alias="customerPhone")
    customer_email: EmailStr | None = Field(default=None, alias="customerEmail")

    model_config = ConfigDict(populate_by_name=True)


class CartRead(CartBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    total_amount: Decimal = Field(alias="totalAmount")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    items: list[CartItemRead] = []


# =========================
# Order items
# =========================

class OrderItemBase(BaseModel):
    product_id: int = Field(alias="productId")
    product_name_snapshot: str = Field(alias="productNameSnapshot")
    price_snapshot: Decimal = Field(alias="priceSnapshot")
    quantity: int


class OrderItemCreate(OrderItemBase):
    model_config = ConfigDict(populate_by_name=True)
    pass


class OrderItemRead(OrderItemBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    order_id: int = Field(alias="orderId")
    
    @computed_field(alias="lineTotal")
    @property
    def line_total(self) -> Decimal:
        return self.price_snapshot * self.quantity

# =========================
# Orders
# =========================

class OrderBase(BaseModel):
    customer_name: str = Field(alias="customerName")
    customer_phone: str = Field(alias="customerPhone")
    customer_email: EmailStr | None = Field(default=None, alias="customerEmail")
    delivery_address: str = Field(alias="deliveryAddress")
    comment: str | None = Field(default=None, alias="comment")


class OrderCreate(OrderBase):
    session_id: str = Field(alias="sessionId")
    address_id: int | None = Field(default=None, alias="addressId")
    items: list[OrderItemCreate]
    
    model_config = ConfigDict(populate_by_name=True)


class OrderRead(OrderBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    order_number: str = Field(alias="orderNumber")
    total_amount: Decimal = Field(alias="totalAmount")
    status: OrderStatus
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    items: list[OrderItemRead] = []


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# =========================
# Mutations
# =========================

class CartItemMutationResponse(BaseModel):
    id: int
    message: str


class OrderMutationResponse(BaseModel):
    id: int
    order_number: str = Field(alias="orderNumber")
    message: str