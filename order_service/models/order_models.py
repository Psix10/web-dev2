from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Annotated

import sqlalchemy as sa
from sqlalchemy import SMALLINT, Boolean
from sqlalchemy import (
    BigInteger,
    String,
    DateTime,
    func,
    ForeignKey,
    Numeric,
    Integer,
    Index,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.db import Base


big_int_pk = Annotated[int, mapped_column(BigInteger, primary_key=True)]


class OrderStatus(str, Enum):
    NEW = 'NEW'
    PROCESSING = 'PROCESSING'
    COMPLETED = 'COMPLETED'
    CANCELLED = 'CANCELLED'


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[big_int_pk]
    session_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, server_default="0.00")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart",
        cascade="all, delete-orphan",
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[big_int_pk]
    cart_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    price_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    cart: Mapped["Cart"] = relationship(back_populates="items")


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_order_number", "order_number"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
    )

    id: Mapped[big_int_pk]
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)    
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        sa.Enum(OrderStatus, name="order_status"),
        nullable=False,
        default=OrderStatus.NEW,
        server_default=OrderStatus.NEW.value,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )

    user = relationship("User")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[big_int_pk]
    order_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    product_name_snapshot: Mapped[str] = mapped_column(String(255), nullable=False)
    price_snapshot: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=sa.true(),
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=sa.false(),
    )

    role_id: Mapped[int] = mapped_column(SMALLINT, nullable=True)

    created_at: Mapped[sa.DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[sa.DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )