from datetime import datetime
from pydantic import BaseModel, Field


class UserAddressCreate(BaseModel):
    label: str | None = Field(default=None, max_length=255)
    recipient_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=255)

    city: str | None = Field(default=None, max_length=255)
    street: str | None = Field(default=None, max_length=255)
    house: str | None = Field(default=None, max_length=255)
    apartment: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=255)

    full_address: str
    is_default: bool = False


class UserAddressUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=255)
    recipient_name: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=255)

    city: str | None = Field(default=None, max_length=255)
    street: str | None = Field(default=None, max_length=255)
    house: str | None = Field(default=None, max_length=255)
    apartment: str | None = Field(default=None, max_length=255)
    postal_code: str | None = Field(default=None, max_length=255)

    full_address: str | None = None
    is_default: bool | None = None


class UserAddressRead(BaseModel):
    id: int
    user_id: int
    label: str | None
    recipient_name: str | None
    phone: str | None
    city: str | None
    street: str | None
    house: str | None
    apartment: str | None
    postal_code: str | None
    full_address: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True