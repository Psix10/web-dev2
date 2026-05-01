# services/password_service.py
from __future__ import annotations

import hashlib

from services.admin_utils import hash_password, verify_password


class PasswordService:
    def hash(self, password: str) -> str:
        return hash_password(password)

    def verify(self, plain_password: str, password_hash: str) -> bool:
        return verify_password(plain_password, password_hash)

    def hash_token(self, value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()