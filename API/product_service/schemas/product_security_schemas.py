from pydantic import BaseModel, EmailStr


class AccessTokenPayload(BaseModel):
    sub: str
    email: EmailStr
    type: str
    iss: str
    aud: str
    exp: int