from __future__ import annotations

from decimal import Decimal
from datetime import datetime
from typing import Annotated

import sqlalchemy as sa
from sqlalchemy import BigInteger, String, DateTime, ForeignKey, Boolean, func, Text, Numeric, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass

big_int_pk = Annotated[int, mapped_column(BigInteger, primary_key=True)]

class Category(Base):
    __tablename__ = "categories"
    
    id: Mapped[big_int_pk]
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=sa.sql.true())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    products: Mapped[list["Product"]] = relationship(back_populates="category", cascade="all, delete-orphan")

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_category_id", "category_id", "name"),
        Index("ix_products_slug", "slug"),
        Index("ix_products_is_active", "is_active"),
    )
    
    id: Mapped[big_int_pk]
    category_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("categories.id", ondelete="SET NULL"), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    wattage: Mapped[int] = mapped_column(Integer, nullable=False)
    voltage: Mapped[int] = mapped_column(Integer, nullable=False)
    base_type: Mapped[str] = mapped_column(String(50), nullable=False)
    color_temperature: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=sa.sql.true())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    category: Mapped["Category"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")

class ProductImage(Base):
    __tablename__ = "product_images"
    
    id: Mapped[big_int_pk]
    product_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_main: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=sa.sql.false())    
    product: Mapped["Product"] = relationship(back_populates="images")