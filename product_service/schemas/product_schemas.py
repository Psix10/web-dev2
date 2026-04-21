# product_service/schemas/product_schemas.py
from typing import Optional, List
from pydantic import BaseModel, Field


class ProductImageOut(BaseModel):
    id: int
    imageUrl: str = Field(alias="image_url")
    isMain: bool = Field(alias="is_main")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class ProductListItem(BaseModel):
    id: int
    sku: str
    name: str
    slug: str
    price: float
    stockQty: int = Field(alias="stock_qty")
    isActive: bool = Field(alias="is_active")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class ProductListResponse(BaseModel):
    items: List[ProductListItem]
    page: int
    size: int
    total: int


class ProductDetail(BaseModel):
    id: int
    categoryId: int = Field(alias="category_id")
    sku: str
    name: str
    slug: str
    description: str
    price: float
    stockQty: int = Field(alias="stock_qty")
    wattage: int
    voltage: int
    baseType: str = Field(alias="base_type")
    colorTemperature: int = Field(alias="color_temperature")
    isActive: bool = Field(alias="is_active")
    images: List[ProductImageOut]

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class ProductCreateImage(BaseModel):
    imageUrl: str
    sortOrder: int = 0
    isMain: bool = True


class ProductCreate(BaseModel):
    categoryId: int
    sku: str
    name: str
    slug: str
    description: str
    price: float
    stockQty: int
    wattage: int
    voltage: int
    baseType: str
    colorTemperature: int
    isActive: bool = True
    images: Optional[List[ProductCreateImage]] = None


class ProductUpdate(BaseModel):
    categoryId: int
    sku: str
    name: str
    slug: str
    description: str
    price: float
    stockQty: int
    wattage: int
    voltage: int
    baseType: str
    colorTemperature: int
    isActive: bool


class ProductStatusUpdate(BaseModel):
    isActive: bool


class ProductMutationResponse(BaseModel):
    id: int
    message: str


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    isActive: bool = Field(alias="is_active")

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    isActive: bool = True


class CategoryUpdate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    isActive: bool