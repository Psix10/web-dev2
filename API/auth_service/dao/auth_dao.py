from requests import session
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth_utils import now_utc
from models.auth_models import (
    User,
    UserSession,
    EmailVerification,
    PasswordResetToken,
)


class AuthDAO:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------
    # Users
    # --------------------

    async def get_user_by_id(self, user_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_active_session_by_refresh_token_hash(
    self,
    refresh_token_hash: str,
    ) -> UserSession | None:
        result = await self.session.execute(
            select(UserSession).where(
                UserSession.refresh_token_hash == refresh_token_hash,
                UserSession.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
    
    async def revoke_unused_verification_tokens(self, user_id: int, used_at) -> None:
        await self.session.execute(
            update(EmailVerification)
            .where(
                EmailVerification.user_id == user_id,
                EmailVerification.used_at.is_(None),
            )
            .values(used_at=used_at)
        )
        await self.session.commit()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def create_user(
        self,
        email: str,
        password_hash: str,
        first_name: str | None = None,
        last_name: str | None = None,
        phone: str | None = None,
    ) -> User:
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def mark_user_as_verified(self, user_id: int) -> None:
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_verified=True)
        )
        await self.session.commit()

    async def update_user_password(self, user_id: int, password_hash: str) -> None:
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(password_hash=password_hash)
        )
        await self.session.commit()

    # --------------------
    # Sessions
    # --------------------

    async def create_session(
        self,
        user_id: int,
        refresh_token_hash: str,
        expires_at,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> UserSession:
        user_session = UserSession(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.session.add(user_session)
        await self.session.commit()
        await self.session.refresh(user_session)
        return user_session

    async def get_session_by_refresh_token_hash(
        self,
        refresh_token_hash: str,
    ) -> UserSession | None:
        result = await self.session.execute(
            select(UserSession).where(
                UserSession.refresh_token_hash == refresh_token_hash
            )
        )
        return result.scalar_one_or_none()

    async def revoke_session(self, session_id: int, revoked_at) -> None:
        result = await self.session.execute(
            update(UserSession)
            .where(UserSession.id == session_id)
            .values(revoked_at=revoked_at)
        )
        await self.session.commit()

    async def revoke_all_user_sessions(self, user_id: int, revoked_at) -> None:
        await self.session.execute(
            update(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
            .values(revoked_at=revoked_at)
        )
        await self.session.commit()

    # --------------------
    # Email verification
    # --------------------

    async def create_email_verification(
        self,
        user_id: int,
        token_hash: str,
        expires_at,
    ) -> EmailVerification:
        verification = EmailVerification(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(verification)
        await self.session.commit()
        await self.session.refresh(verification)
        return verification

    async def get_email_verification_by_token_hash(
        self,
        token_hash: str,
    ) -> EmailVerification | None:
        result = await self.session.execute(
            select(EmailVerification).where(
                EmailVerification.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()

    async def mark_email_verification_as_used(self, verification_id: int, used_at) -> None:
        await self.session.execute(
            update(EmailVerification)
            .where(EmailVerification.id == verification_id)
            .values(used_at=used_at)
        )
        await self.session.commit()

    # --------------------
    # Password reset
    # --------------------

    async def create_password_reset_token(
        self,
        user_id: int,
        token_hash: str,
        expires_at,
    ) -> PasswordResetToken:
        reset_token = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(reset_token)
        await self.session.commit()
        await self.session.refresh(reset_token)
        return reset_token

    async def get_password_reset_token_by_hash(
        self,
        token_hash: str,
    ) -> PasswordResetToken | None:
        result = await self.session.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()

    async def mark_password_reset_token_as_used(self, token_id: int, used_at) -> None:
        await self.session.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.id == token_id)
            .values(used_at=used_at)
        )
        await self.session.commit()