from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr

from models.order import OrderStatus

class CartItemBase(Basemodel):
    product_id: int
    product_name_snapshot: str
    price_snapshot: Decimal
    quantity: int

class CartItemCreate(CartItemBase):
    pass

class CartItemRead(CartItemBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    cart_id: int

class CartBase(BaseModel):
    session_id: str
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_email: EmailStr | None = None

class CartCreate(CartBase):
    pass

class CartUpdate(BaseModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_email: EmailStr | None = None

class CartRead(CartBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime
    items: list[CartItemRead] = []

class OrderItemBase(BaseModel):
    product_id: int
    product_name_snapshot: str
    price_snapshot: Decimal
    quantity: int
    line_total: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemRead(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    order_id: int

class OrderBase(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: EmailStr | None = None
    delivery_address: str
    comment: str | None = None

class OrderCreate(OrderBase):
    items: list[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    order_number: str
    total_amount: Decimal
    status: OrderStatus
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead] = []
