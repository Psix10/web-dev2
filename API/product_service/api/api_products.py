from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


from db.db import get_session
from dao.product_dao import ProductsDAO
from api.dependencies import get_current_user_email, get_current_user_id
from models.product_models import Product, Category
from schemas.product_schemas import (
    ProductListResponse,
    ProductDetail,
    ProductCreate,
    ProductUpdate,
    ProductStatusUpdate,
    ProductMutationResponse,
    CategoryOut,
    CategoryCreate,
    CategoryUpdate,
)


router = APIRouter(prefix="/api", tags=["products"])


@router.get("/products", response_model=ProductListResponse, response_model_by_alias=True)
async def get_products(
    category: int | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    base_type: str | None = Query(None),
    wattage: int | None = Query(None),
    color_temperature: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    dao = ProductsDAO(session)
    products, total = await dao.list_products(
        category_id=category,
        min_price=min_price,
        max_price=max_price,
        base_type=base_type,
        wattage=wattage,
        color_temperature=color_temperature,
        page=page,
        size=size,
    )

    items = []
    for product in products:
        category_name = product.category.name if product.category else None

        main_image = next(
            (image for image in product.images if image.is_main),
            product.images[0] if product.images else None,
        )

        items.append({
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "slug": product.slug,
            "price": float(product.price),
            "stockQty": product.stock_quantity,
            "isActive": product.is_active,
            "category": category_name,
            "imageUrl": main_image.image_url if main_image else None,
        })

    return {
        "items": items,
        "page": page,
        "size": size,
        "total": total,
    }

@router.get("/products/{product_id}", response_model=ProductDetail, response_model_by_alias=True)
async def get_product_by_id(
    product_id: int,
    session: AsyncSession = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = await dao.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/products/slug/{slug}", response_model=ProductDetail, response_model_by_alias=True)
async def get_product_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = await dao.get_by_slug(slug)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/categories", response_model=list[CategoryOut], response_model_by_alias=True)
async def get_categories(session: AsyncSession = Depends(get_session)):
    stmt = select(Category).where(Category.is_active.is_(True))
    result = await session.scalars(stmt)
    return list(result.all())


@router.post("/admin/products", response_model=ProductMutationResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    session: AsyncSession = Depends(get_session),
    
):
    dao = ProductsDAO(session)
    product = await dao.create_product(payload)
    await session.commit()
    return {"id": product.id, "message": "Product created"}


@router.put("/admin/products/{product_id}", response_model=ProductMutationResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    session: AsyncSession = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = await dao.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await dao.update_product(product, payload)
    await session.commit()
    return {"id": product.id, "message": "Product updated"}


@router.patch("/admin/products/{product_id}/status", response_model=ProductMutationResponse)
async def change_product_status(
    product_id: int,
    payload: ProductStatusUpdate,
    session: AsyncSession = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = await dao.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await dao.set_status(product, payload.is_active)
    await session.commit()
    return {"id": product.id, "message": "Status changed"}


@router.delete("/admin/products/{product_id}", response_model=ProductMutationResponse)
async def delete_product(
    product_id: int,
    session: AsyncSession = Depends(get_session),
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await session.delete(product)
    await session.commit()
    return {"message": "Product deleted", "id": product_id}


@router.post("/admin/categories", response_model=ProductMutationResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    session: AsyncSession = Depends(get_session),
):
    category = Category(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        is_active=payload.is_active,
    )
    session.add(category)
    await session.commit()
    return {"id": category.id, "message": "Category created"}


@router.put("/admin/categories/{category_id}", response_model=ProductMutationResponse)
async def update_category(
    category_id: int,
    payload: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
):
    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    category.name = payload.name
    category.slug = payload.slug
    category.description = payload.description
    category.is_active = payload.is_active

    await session.commit()
    return {"id": category.id, "message": "Category updated"}


@router.get("/my-debug")
async def my_debug_info(
    user_id: int = Depends(get_current_user_id),
    email: str = Depends(get_current_user_email),
):
    return {
        "user_id": user_id,
        "email": email,
    }