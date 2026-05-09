from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.address_models import UserAddress


class UserAddressDAO:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_user_addresses(self, user_id: int) -> list[UserAddress]:
        result = await self.session.execute(
            select(UserAddress)
            .where(UserAddress.user_id == user_id)
            .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_user_address_by_id(self, user_id: int, address_id: int) -> UserAddress | None:
        result = await self.session.execute(
            select(UserAddress).where(
                UserAddress.id == address_id,
                UserAddress.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def unset_default_addresses(self, user_id: int) -> None:
        await self.session.execute(
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )
        await self.session.flush()

    async def create_user_address(self, user_id: int, payload) -> UserAddress:
        if payload.is_default:
            await self.unset_default_addresses(user_id)

        address = UserAddress(
            user_id=user_id,
            label=payload.label,
            recipient_name=payload.recipient_name,
            phone=payload.phone,
            city=payload.city,
            street=payload.street,
            house=payload.house,
            apartment=payload.apartment,
            postal_code=payload.postal_code,
            full_address=payload.full_address,
            is_default=payload.is_default,
        )
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def update_user_address(self, address: UserAddress, payload) -> UserAddress:
        update_data = payload.model_dump(exclude_unset=True)

        if update_data.get("is_default") is True:
            await self.unset_default_addresses(address.user_id)

        for field, value in update_data.items():
            setattr(address, field, value)

        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def delete_user_address(self, address: UserAddress) -> None:
        await self.session.delete(address)
        await self.session.commit()