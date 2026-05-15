from pydantic import BaseModel, Field, ConfigDict


class ProductImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    image_url: str = Field(alias="imageUrl")
    is_main: bool = Field(alias="isMain")
    sort_order: int = Field(alias="sortOrder")


class ProductListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    sku: str
    name: str
    slug: str
    price: float
    stock_quantity: int = Field(alias="stockQty")
    is_active: bool = Field(alias="isActive")
    category: str | None = None
    image_url: str | None = Field(default=None, alias="imageUrl")


class ProductListResponse(BaseModel):
    items: list[ProductListItem]
    page: int
    size: int
    total: int


class ProductDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    category_id: int = Field(alias="categoryId")
    sku: str
    name: str
    slug: str
    description: str
    price: float
    stock_quantity: int = Field(alias="stockQty")
    wattage: int | None = None
    voltage: int | None = None
    base_type: str | None = Field(default=None, alias="baseType")
    color_temperature: int | None = Field(default=None, alias="colorTemperature")
    is_active: bool = Field(alias="isActive")
    images: list[ProductImageOut] = []


class ProductCreateImage(BaseModel):
    image_url: str
    sort_order: int = 0
    is_main: bool = True


class ProductCreate(BaseModel):
    category_id: int
    sku: str
    name: str
    slug: str
    description: str
    price: float
    stock_quantity: int
    wattage: int | None = None
    voltage: int | None = None
    base_type: str | None = None
    color_temperature: int | None = None
    is_active: bool = True
    images: list[ProductCreateImage] | None = None


class ProductUpdate(BaseModel):
    category_id: int
    sku: str
    name: str
    slug: str
    description: str
    price: float
    stock_quantity: int
    wattage: int | None = None
    voltage: int | None = None
    base_type: str | None = None
    color_temperature: int | None = None
    is_active: bool
    images: list[ProductCreateImage] | None = None


class ProductStatusUpdate(BaseModel):
    is_active: bool


class ProductMutationResponse(BaseModel):
    id: int
    message: str


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    slug: str
    description: str | None = None
    is_active: bool = Field(alias="isActive")


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    is_active: bool