"""
Authentication and authorization utilities
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from starlette.requests import Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

import httpx




from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.auth0 import verify_auth0_token
# from sqlalchemy.orm import Session # Already imported

# Reusable security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates Auth0 token and returns the local User object.
    Creates the user if they don't exist (JIT Provisioning).
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials
    try:
        payload = verify_auth0_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Extract user info from Auth0 claims
    # Standard claims: sub (Auth0 ID), email, name/nickname
    # Note: You might need to add a custom rule/action in Auth0 to add email to access token
    # or call /userinfo endpoint. For now, we assume email is in the token.
    auth0_id = payload.get("sub")
    email = payload.get("email") # Requires Auth0 'email' scope and rule
    
    # Fallback if email is missing (common with standard access tokens)
    # Ideally, we call Auth0 /userinfo, but to keep it simple, we require email in token
    # (Checking permissions/scopes could also be done here)
    
    if not email:
        # For this demo, if email is missing, we might fail or use a placeholder
        # In production: Fetch from /userinfo
        # raise HTTPException(status_code=400, detail="Email claim missing from token")
        pass 

    # Find user by Auth0 ID (ideal) or Email (legacy)
    # We might need to add auth0_id to User model?
    # For now, let's look up by email match.
    
    if not email:
         # If no email in token, we can't sync easily without a lookup.
         # TEMPORARY: Return a mock or error?
         # Real solution: Call Auth0 /userinfo here using the token
         # import httpx # Already imported at the top
         async with httpx.AsyncClient() as client:
             userinfo = await client.get(f"https://{os.getenv('AUTH0_DOMAIN')}/userinfo", headers={"Authorization": f"Bearer {token}"})
             if userinfo.status_code == 200:
                 data = userinfo.json()
                 email = data.get("email")
                 name = data.get("name")
                 picture = data.get("picture")
             else:
                 raise HTTPException(status_code=401, detail="Failed to fetch user info")

    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # JIT Provisioning
        user = User(
            email=email,
            name=payload.get("name", email.split("@")[0]), 
            role="user",
            is_active=True,
            hashed_password=None # Auth0 users have no local password
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user


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

