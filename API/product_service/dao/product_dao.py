from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.product_models import Product, ProductImage


class ProductsDAO:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_products(
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
    ) -> tuple[list[Product], int]:
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )            
            .where(Product.is_active.is_(True))
        )

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

        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.session.scalar(total_stmt) or 0

        stmt = stmt.offset((page - 1) * size).limit(size)
        result = await self.session.scalars(stmt)
        items = list(result.all())
        return items, total

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.images))
        )
        return await self.session.scalar(stmt)

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(Product.slug == slug)
            .options(selectinload(Product.images))
        )
        return await self.session.scalar(stmt)

    async def create_product(self, data) -> Product:
        product = Product(
            category_id=data.category_id,
            sku=data.sku,
            name=data.name,
            slug=data.slug,
            description=data.description,
            price=data.price,
            stock_quantity=data.stock_quantity,
            wattage=data.wattage,
            voltage=data.voltage,
            base_type=data.base_type,
            color_temperature=data.color_temperature,
            is_active=data.is_active,
        )
        self.session.add(product)
        await self.session.flush()

        if data.images:
            for img in data.images:
                self.session.add(
                    ProductImage(
                        product_id=product.id,
                        image_url=img.image_url,
                        sort_order=img.sort_order,
                        is_main=img.is_main,
                    )
                )

        await self.session.flush()
        return product

    async def update_product(self, product: Product, data) -> Product:
        product.category_id = data.category_id
        product.sku = data.sku
        product.name = data.name
        product.slug = data.slug
        product.description = data.description
        product.price = data.price
        product.stock_quantity = data.stock_quantity
        product.wattage = data.wattage
        product.voltage = data.voltage
        product.base_type = data.base_type
        product.color_temperature = data.color_temperature
        product.is_active = data.is_active
        await self.session.flush()
        return product

    async def set_status(self, product: Product, is_active: bool) -> Product:
        product.is_active = is_active
        await self.session.flush()
        return product