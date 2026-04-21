# product_service/dao/products_dao.py
from typing import Sequence, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from product_service.models.product_models import Product, Category, ProductImage


class ProductsDAO:
    def __init__(self, session: Session):
        self.session = session

    def list_products(
        self,
        *,
        category_id: Optional[int],
        min_price: Optional[float],
        max_price: Optional[float],
        base_type: Optional[str],
        wattage: Optional[int],
        color_temperature: Optional[int],
        page: int,
        size: int,
    ) -> Tuple[Sequence[Product], int]:
        stmt = select(Product).where(Product.is_active.is_(True))

        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
        if min_price is not None:
            stmt = stmt.where(Product.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.price <= max_price)
        if base_type is not None:
            stmt = stmt.where(Product.base_type == base_type)
        if wattage is not None:
            stmt = stmt.where(Product.wattage == wattage)
        if color_temperature is not None:
            stmt = stmt.where(Product.color_temperature == color_temperature)

        total = self.session.scalar(
            select(func.count()).select_from(stmt.subquery())
        ) or 0

        stmt = stmt.offset((page - 1) * size).limit(size)
        items = self.session.scalars(stmt).all()
        return items, total

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.session.get(Product, product_id)

    def get_by_slug(self, slug: str) -> Optional[Product]:
        stmt = select(Product).where(Product.slug == slug)
        return self.session.scalar(stmt)

    def create_product(self, data) -> Product:
        product = Product(
            category_id=data.categoryId,
            sku=data.sku,
            name=data.name,
            slug=data.slug,
            description=data.description,
            price=data.price,
            stock_qty=data.stockQty,
            wattage=data.wattage,
            voltage=data.voltage,
            base_type=data.baseType,
            color_temperature=data.colorTemperature,
            is_active=data.isActive,
        )
        self.session.add(product)
        self.session.flush()

        if data.images:
            for img in data.images:
                self.session.add(
                    ProductImage(
                        product_id=product.id,
                        image_url=img.imageUrl,
                        sort_order=img.sortOrder,
                        is_main=img.isMain,
                    )
                )

        return product

    def update_product(self, product: Product, data) -> Product:
        product.category_id = data.categoryId
        product.sku = data.sku
        product.name = data.name
        product.slug = data.slug
        product.description = data.description
        product.price = data.price
        product.stock_qty = data.stockQty
        product.wattage = data.wattage
        product.voltage = data.voltage
        product.base_type = data.baseType
        product.color_temperature = data.colorTemperature
        product.is_active = data.isActive
        return product

    def set_status(self, product: Product, is_active: bool) -> Product:
        product.is_active = is_active
        return product

    # аналогично методы для Category