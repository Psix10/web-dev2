from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from db.db import get_session
from dao.user_address_dao import UserAddressDAO
from services.user_address_service import UserAddressService
from schemas.address_schemas import (
    UserAddressCreate,
    UserAddressRead,
    UserAddressUpdate,
)
from services.order_service import current_user

router = APIRouter(
    prefix="/api/users/me/addresses",
    tags=["User addresses"],
    dependencies=[Depends(current_user)],
)


def get_user_address_service(
    session: AsyncSession = Depends(get_session),
) -> UserAddressService:
    dao = UserAddressDAO(session)
    return UserAddressService(dao)


@router.get("", response_model=list[UserAddressRead])
async def list_my_addresses(
    user=Depends(current_user),
    service: UserAddressService = Depends(get_user_address_service),
):
    return await service.list_addresses(user["id"])


@router.post("", response_model=UserAddressRead, status_code=status.HTTP_201_CREATED)
async def create_my_address(
    payload: UserAddressCreate,
    user=Depends(current_user),
    service: UserAddressService = Depends(get_user_address_service),
):
    return await service.create_address(user["id"], payload)


@router.patch("/{address_id}", response_model=UserAddressRead)
async def update_my_address(
    address_id: int,
    payload: UserAddressUpdate,
    user=Depends(current_user),
    service: UserAddressService = Depends(get_user_address_service),
):
    return await service.update_address(user["id"], address_id, payload)


@router.delete("/{address_id}")
async def delete_my_address(
    address_id: int,
    user=Depends(current_user),
    service: UserAddressService = Depends(get_user_address_service),
):
    return await service.delete_address(user["id"], address_id)


@router.patch("/{address_id}/default", response_model=UserAddressRead)
async def set_default_my_address(
    address_id: int,
    user=Depends(current_user),
    service: UserAddressService = Depends(get_user_address_service),
):
    return await service.set_default_address(user["id"], address_id)