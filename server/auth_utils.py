"""认证工具函数：JWT 与密码摘要。"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

# TODO: 生产环境需设置强随机字符串的 JWT_SECRET 环境变量
_SECRET = os.environ.get("JWT_SECRET", "zhaobiao-dev-secret-2026")
_ALGORITHM = "HS256"
_PASSWORD_CONTEXT = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def create_access_token(payload: dict, expires_days: int = 7) -> str:
    """生成 JWT token，默认有效期 7 天。"""
    data = payload.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    data["exp"] = expire
    return jwt.encode(data, _SECRET, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """解析 JWT token，返回 payload；无效或过期返回 None。"""
    try:
        return jwt.decode(token, _SECRET, algorithms=[_ALGORITHM])
    except JWTError:
        return None


def hash_password(password: str) -> str:
    """生成密码摘要。"""
    return _PASSWORD_CONTEXT.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """校验密码与摘要是否匹配。"""
    if not password_hash:
        return False
    return _PASSWORD_CONTEXT.verify(password, password_hash)
