from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, BigInteger, DateTime, func, ForeignKey, \
    Numeric, Integer, Index, Text
from decimal import Decimal
from datetime import datetime
from enum import Enum
from typing import Annotated

from db.db import Base

int_pk = Annotated[int, mapped_column(BigInteger, primary_key=True)]

class OrderStatus(str, Enum):
    NEW = "new"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Cart(Base):
    __tablename__ = "carts"
    
    id: Mapped[int_pk]
    session_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    itmes: Mapped[list["CartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id: Mapped[int_pk]
    cart_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_name_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    
    cart: Mapped["Cart"] = relationship(back_populates="items")

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_order_number", "order_number"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
    )
    
    id: Mapped[int_pk]
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(255), nullable=True)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(String(50), nullable=False, default=OrderStatus.NEW)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id: Mapped[int_pk]
    order_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    price_snapshot: Mapped[Decimal] = mapped_column(Integer, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    order: Mapped["Order"] = relationship(back_populates="items")