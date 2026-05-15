import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.db import get_session
from dao.admin_dao import AdminDAO
from services.admin_utils import hash_password
from models.admin_models import Role, Permission, RolePermission

INITIAL_ADMIN_EMAIL = os.getenv("INITIAL_ADMIN_EMAIL", "admin@example.com")
INITIAL_ADMIN_PASSWORD = os.getenv("INITIAL_ADMIN_PASSWORD", "admin123")


ROLE_DEFINITIONS = {
    "user": "Customer role",
    "manager": "Manager role",
    "admin": "Administrator role",
}


PERMISSION_DEFINITIONS = {
    "catalog:read": "Read product catalog",
    "cart:write": "Manage cart",
    "order:create": "Create order",
    "order:read_own": "Read own orders",
    "order:read_all": "Read all orders",
    "order:update_status": "Update order status",

    "product:read": "Read products in admin panel",
    "product:create": "Create products",
    "product:update": "Update products",
    "product:status": "Change product status",
    "product:delete": "Delete products",

    "category:read": "Read categories in admin panel",
    "category:create": "Create categories",
    "category:update": "Update categories",
    "category:delete": "Delete categories",

    "admin:manage_users": "Manage admin users",
    "admin:manage_roles": "Manage roles and permissions",
    "admin:manage_orders": "Manage orders (read/update status)",
}


ROLE_PERMISSIONS = {
    "user": {
        "catalog:read",
        "cart:write",
        "order:create",
        "order:read_own",
    },
    "manager": {
        "catalog:read",
        "cart:write",
        "order:create",
        "order:read_own",
        "order:read_all",
        "order:update_status",
        "product:read",
        "product:create",
        "product:update",
        "product:status",
        "category:read",
    },
    "admin": {
        "catalog:read",
        "cart:write",
        "order:create",
        "order:read_own",
        "order:read_all",
        "order:update_status",
        "product:read",
        "product:create",
        "product:update",
        "product:status",
        "product:delete",
        "category:read",
        "category:create",
        "category:update",
        "category:delete",
        "admin:manage_users",
        "admin:manage_roles",
        "admin:manage_orders",
    },
}


async def seed_admin_data() -> None:
    async for db in get_session():
        admin_role = await db.scalar(
            select(Role).where(Role.name == "admin")
        )

        if admin_role is None:
            raise RuntimeError("Admin role was not seeded")

        dao = AdminDAO(db)
        existing_admin = await dao.get_admin_by_email(INITIAL_ADMIN_EMAIL)

        if not existing_admin:
            await dao.create_admin(
                first_name="Super",
                last_name="Admin",
                email=INITIAL_ADMIN_EMAIL,
                password_hash=hash_password(INITIAL_ADMIN_PASSWORD),
                role_id=admin_role.id,
                is_active=True,
            )
            await db.commit()

        return


async def seed_rbac(session: AsyncSession) -> None:
    role_map: dict[str, Role] = {}
    permission_map: dict[str, Permission] = {}

    for role_name, description in ROLE_DEFINITIONS.items():
        existing = await session.scalar(select(Role).where(Role.name == role_name))
        if existing is None:
            existing = Role(name=role_name, description=description)
            session.add(existing)
            await session.flush()
        role_map[role_name] = existing

    for code, description in PERMISSION_DEFINITIONS.items():
        existing = await session.scalar(select(Permission).where(Permission.code == code))
        if existing is None:
            existing = Permission(code=code, description=description)
            session.add(existing)
            await session.flush()
        permission_map[code] = existing

    for role_name, permission_codes in ROLE_PERMISSIONS.items():
        role = role_map[role_name]
        for code in permission_codes:
            permission = permission_map[code]
            existing_link = await session.scalar(
                select(RolePermission).where(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == permission.id,
                )
            )
            if existing_link is None:
                session.add(RolePermission(role_id=role.id, permission_id=permission.id))

    await session.commit()