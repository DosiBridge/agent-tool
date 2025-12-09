"""
Superadmin routes for user management and system settings
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from src.core import get_db, User, LLMConfig, DB_AVAILABLE
from src.core.models import User as UserModel
from src.core.auth import get_current_active_user

router = APIRouter()


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    role: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None


class SystemStatsResponse(BaseModel):
    total_users: int
    active_users: int
    blocked_users: int
    total_conversations: int
    total_documents: int
    total_mcp_servers: int


def get_current_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get the current superadmin user (requires superadmin role)"""
    # Check if user has superadmin role
    if not hasattr(current_user, 'role') or getattr(current_user, 'role', 'user') != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """List all users (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    users = db.query(UserModel).order_by(UserModel.created_at.desc()).all()
    return [user.to_dict() for user in users]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Get a specific user (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.to_dict()


@router.put("/users/{user_id}/block")
async def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Block a user (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if hasattr(user, 'role') and user.role == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot block superadmin user")
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    return {"status": "success", "message": "User blocked successfully", "user": user.to_dict()}


@router.put("/users/{user_id}/unblock")
async def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Unblock a user (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return {"status": "success", "message": "User unblocked successfully", "user": user.to_dict()}


@router.get("/system/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Get system statistics (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from src.core.models import Conversation, Document, MCPServer
    
    total_users = db.query(UserModel).count()
    active_users = db.query(UserModel).filter(UserModel.is_active == True).count()
    total_conversations = db.query(Conversation).count() if Conversation else 0
    total_documents = db.query(Document).count() if Document else 0
    total_mcp_servers = db.query(MCPServer).count() if MCPServer else 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "blocked_users": total_users - active_users,
        "total_conversations": total_conversations,
        "total_documents": total_documents,
        "total_mcp_servers": total_mcp_servers
    }
