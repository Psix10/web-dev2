# product_service/api/api_products.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from product_service.db.db import get_session
from product_service.dao.product_dao import ProductsDAO
from product_service.schemas.product_schemas import (
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


# Public

@router.get("/products", response_model=ProductListResponse)
def get_products(
    category: int | None = Query(None),
    minPrice: float | None = Query(None),
    maxPrice: float | None = Query(None),
    baseType: str | None = Query(None),
    wattage: int | None = Query(None),
    colorTemperature: int | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
):
    dao = ProductsDAO(session)
    items, total = dao.list_products(
        category_id=category,
        min_price=minPrice,
        max_price=maxPrice,
        base_type=baseType,
        wattage=wattage,
        color_temperature=colorTemperature,
        page=page,
        size=size,
    )

    return {
        "items": items,
        "page": page,
        "size": size,
        "total": total,
    }


@router.get("/products/{product_id}", response_model=ProductDetail)
def get_product_by_id(
    product_id: int,
    session: Session = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = dao.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/products/slug/{slug}", response_model=ProductDetail)
def get_product_by_slug(
    slug: str,
    session: Session = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = dao.get_by_slug(slug)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/categories", response_model=list[CategoryOut])
def get_categories(
    session: Session = Depends(get_session),
):
    from product_service.models.product_models import Category
    categories = session.query(Category).filter(Category.is_active.is_(True)).all()
    return categories


# Admin — здесь ещё нужен Depends на auth из Admin Service / JWT

@router.post("/admin/products", response_model=ProductMutationResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    session: Session = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = dao.create_product(payload)
    session.commit()
    return {"id": product.id, "message": "Product created"}


@router.put("/admin/products/{product_id}", response_model=ProductMutationResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    session: Session = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = dao.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    dao.update_product(product, payload)
    session.commit()
    return {"id": product.id, "message": "Product updated"}


@router.patch("/admin/products/{product_id}/status", response_model=ProductMutationResponse)
def change_product_status(
    product_id: int,
    payload: ProductStatusUpdate,
    session: Session = Depends(get_session),
):
    dao = ProductsDAO(session)
    product = dao.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    dao.set_status(product, payload.isActive)
    session.commit()
    return {"id": product.id, "message": "Status changed"}


@router.delete("/admin/products/{product_id}", response_model=ProductMutationResponse)
def delete_product(
    product_id: int,
    session: Session = Depends(get_session),
):
    from product_service.models.product_models import Product

    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    session.delete(product)
    session.commit()
    return {"message": "Product deleted", "id": product_id}


@router.post("/admin/categories", response_model=ProductMutationResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    session: Session = Depends(get_session),
):
    from product_service.models.product_models import Category

    category = Category(
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
        is_active=payload.isActive,
    )
    session.add(category)
    session.commit()
    return {"id": category.id, "message": "Category created"}


@router.put("/admin/categories/{category_id}", response_model=ProductMutationResponse)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    session: Session = Depends(get_session),
):
    from product_service.models.product_models import Category

    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    category.name = payload.name
    category.slug = payload.slug
    category.description = payload.description
    category.is_active = payload.isActive

    session.commit()
    return {"id": category.id, "message": "Category updated"}