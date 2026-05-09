from fastapi import HTTPException, status

from dao.user_address_dao import UserAddressDAO


class UserAddressService:
    def __init__(self, dao: UserAddressDAO):
        self.dao = dao

    async def list_addresses(self, user_id: int):
        return await self.dao.list_user_addresses(user_id)

    async def create_address(self, user_id: int, payload):
        return await self.dao.create_user_address(user_id, payload)

    async def update_address(self, user_id: int, address_id: int, payload):
        address = await self.dao.get_user_address_by_id(user_id, address_id)
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found",
            )

        return await self.dao.update_user_address(address, payload)

    async def delete_address(self, user_id: int, address_id: int):
        address = await self.dao.get_user_address_by_id(user_id, address_id)
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found",
            )

        await self.dao.delete_user_address(address)
        return {"message": "Address deleted successfully"}

    async def set_default_address(self, user_id: int, address_id: int):
        address = await self.dao.get_user_address_by_id(user_id, address_id)
        if not address:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found",
            )

        class SetDefaultPayload:
            def model_dump(self, exclude_unset=True):
                return {"is_default": True}

        return await self.dao.update_user_address(address, SetDefaultPayload())