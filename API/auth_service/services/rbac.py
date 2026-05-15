ROLE_DEFINITIONS = {
    "user": "Customer role",
}

PERMISSION_DEFINITIONS = {
    "catalog:read": "Read product catalog",
    "cart:write": "Manage cart",
    "order:create": "Create order",
    "order:read_own": "Read own orders",
}

ROLE_PERMISSIONS = {
    "user": {
        "catalog:read",
        "cart:write",
        "order:create",
        "order:read_own",
    },
}


def get_permissions_for_role(role_name: str) -> list[str]:
    return sorted(list(ROLE_PERMISSIONS.get(role_name, set())))