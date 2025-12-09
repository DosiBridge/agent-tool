"""
Authentication and authorization utilities
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from starlette.requests import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

# Password hashing - use bcrypt directly to avoid passlib initialization issues
# This avoids the "password cannot be longer than 72 bytes" error during passlib's bug detection
USE_DIRECT_BCRYPT = False
try:
    import bcrypt
    USE_DIRECT_BCRYPT = True
except ImportError:
    # Fallback to passlib if bcrypt is not available
    # Note: This may have issues with newer bcrypt versions
    try:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize password hashing: {e}")
        pwd_context = None

# JWT settings
# Enforce non-default secret key in production
DEFAULT_SECRET_KEY = "your-secret-key-change-in-production-use-env-var"
SECRET_KEY = os.getenv("JWT_SECRET_KEY", DEFAULT_SECRET_KEY)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Check if we're in production and enforce secret key
IS_PRODUCTION = os.getenv("ENVIRONMENT", "").lower() in ("production", "prod") or os.getenv("NODE_ENV", "").lower() == "production"
if IS_PRODUCTION and SECRET_KEY == DEFAULT_SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY must be set to a secure random value in production. "
        "Do not use the default secret key. Set JWT_SECRET_KEY environment variable."
    )

# HTTP Bearer token
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    if USE_DIRECT_BCRYPT:
        # Use bcrypt directly
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            print(f"⚠️  Password verification error: {e}")
            return False
    else:
        # Use passlib (fallback)
        if pwd_context is None:
            raise RuntimeError("Password hashing not available. Please install bcrypt.")
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    if USE_DIRECT_BCRYPT:
        # Use bcrypt directly - handles 72-byte limit automatically
        # Bcrypt will truncate passwords longer than 72 bytes
        password_bytes = password.encode('utf-8')
        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    else:
        # Use passlib (fallback)
        if pwd_context is None:
            raise RuntimeError("Password hashing not available. Please install bcrypt.")
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes (this is very rare for normal passwords)
            password_bytes = password_bytes[:72]
            password = password_bytes.decode('utf-8', errors='ignore')
        return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    from datetime import timezone
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get the current authenticated user from JWT token.
    Supports usage by Superadmin to impersonate other users via 'X-Impersonate-User' header.
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        return None
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        return None
    
    # Convert to int if it's a string
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        return None
    
    # 1. Fetch the REAL user (from the token)
    real_user = db.query(User).filter(User.id == user_id).first()
    if real_user is None or not real_user.is_active:
        return None
        
    # 2. Check for Impersonation (Superadmin only)
    if request and real_user.role == "superadmin":
        impersonate_id = request.headers.get("X-Impersonate-User")
        if impersonate_id:
            try:
                target_id = int(impersonate_id)
                target_user = db.query(User).filter(User.id == target_id).first()
                if target_user:
                    return target_user
            except ValueError:
                pass # Invalid ID format, ignore
                
    return real_user


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Get the current active user (requires authentication)"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    return current_user

