"""
Superadmin routes for user management and system settings
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from src.core import get_db, User, LLMConfig, DB_AVAILABLE
from src.core.models import User as UserModel, EmbeddingConfig, UserGlobalConfigPreference, UserAppeal
from src.core.auth import get_current_active_user, get_current_user
from src.services.usage_tracker import usage_tracker
from sqlalchemy.sql import func

router = APIRouter()


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    role: str
    picture: Optional[str] = None
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


def get_current_admin_or_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get the current admin or superadmin user (requires admin or superadmin role)"""
    role = getattr(current_user, 'role', 'user')
    if role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or superadmin access required"
        )
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """List all users (admin or superadmin only)"""
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


@router.put("/users/{user_id}/promote-to-superadmin")
async def promote_to_superadmin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Promote a user to superadmin (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a superadmin
    if hasattr(user, 'role') and user.role == "superadmin":
        raise HTTPException(status_code=400, detail="User is already a superadmin")
    
    # Promote to superadmin
    user.role = "superadmin"
    # Ensure user is active when promoted
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return {"status": "success", "message": "User promoted to superadmin successfully", "user": user.to_dict()}


@router.put("/users/{user_id}/promote-to-admin")
async def promote_to_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Promote a user to admin (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already an admin or superadmin
    if hasattr(user, 'role') and user.role in ["admin", "superadmin"]:
        raise HTTPException(status_code=400, detail=f"User is already a {user.role}")
    
    # Promote to admin
    user.role = "admin"
    # Ensure user is active when promoted
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    return {"status": "success", "message": "User promoted to admin successfully", "user": user.to_dict()}


@router.put("/users/{user_id}/demote-to-user")
async def demote_to_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Demote an admin to user (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is a superadmin (cannot demote superadmin)
    if hasattr(user, 'role') and user.role == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot demote superadmin to user")
    
    # Check if user is already a regular user
    if hasattr(user, 'role') and user.role == "user":
        raise HTTPException(status_code=400, detail="User is already a regular user")
    
    # Demote to user
    user.role = "user"
    db.commit()
    db.refresh(user)
    
    return {"status": "success", "message": "User demoted to regular user successfully", "user": user.to_dict()}


@router.get("/system/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """Get system statistics (admin or superadmin)"""
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


@router.get("/system/usage-history")
async def get_system_usage_history(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """Get system-wide usage history (admin or superadmin)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    return usage_tracker.get_system_usage_history(db, days=days)


# --- Global Configuration Routes ---

class GlobalLLMConfigRequest(BaseModel):
    type: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    is_default: bool = False

class GlobalEmbeddingConfigRequest(BaseModel):
    provider: str = "openai"
    model: str = "text-embedding-3-small"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    is_default: bool = False

class GlobalMCPRequest(BaseModel):
    name: str
    url: str
    connection_type: str = "http"
    api_key: Optional[str] = None
    headers: Optional[dict] = None

@router.post("/global-config/llm")
async def create_global_llm_config(
    config: GlobalLLMConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Create a global LLM configuration (superadmin only). Only superadmin can set is_default."""
    try:
        if not DB_AVAILABLE:
            raise HTTPException(status_code=503, detail="Database not available")


        # Test configuration before saving
        test_message = None
        if config.api_key:
            from src.services.llm_testing import test_llm_config
            
            # Build config dict for testing
            config_dict = {
                "type": config.type,
                "model": config.model,
                "api_key": config.api_key,
                "base_url": config.base_url
            }
            
            test_success, test_message = await test_llm_config(config_dict)
            if not test_success:
                raise HTTPException(
                    status_code=400,
                    detail=f"Configuration test failed: {test_message}. Please fix the configuration before saving."
                )

        # If setting this as default, unset other global defaults first
        # Global configs use user_id=None (backward compatible with user_id=1)
        if config.is_default:
            db.query(LLMConfig).filter(
                (LLMConfig.user_id.is_(None) | (LLMConfig.user_id == 1)),  # Prioritize None, support legacy ID=1
                LLMConfig.is_default == True
            ).update({LLMConfig.is_default: False})

        # Create new config with user_id = None (global)
        new_config = LLMConfig(
            user_id=None,  # Global config
            type=config.type,
            model=config.model,
            base_url=config.base_url,
            is_default=config.is_default
        )
        
        if config.api_key:
            from src.utils.encryption import encrypt_value
            new_config.api_key = encrypt_value(config.api_key)
            
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        
        return {"status": "success", "config": new_config.to_dict(), "test_message": test_message if config.api_key else None}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Error creating global LLM config: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create global LLM configuration: {str(e)}"
        )

@router.post("/global-config/mcp")
async def create_global_mcp_server(
    server: GlobalMCPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Add a global MCP server (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import MCPServer
    from src.utils.mcp_connection_test import test_mcp_connection
    
    # Check if name already exists globally (user_id=None, backward compatible with user_id=1)
    existing = db.query(MCPServer).filter(
        (MCPServer.user_id.is_(None) | (MCPServer.user_id == 1)),  # Prioritize None, support legacy ID=1
        MCPServer.name == server.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Global MCP server with this name already exists")
    
    # Normalize URL based on connection type
    connection_type = (server.connection_type or "http").lower()
    if connection_type == "stdio":
        normalized_url = server.url.strip()
    else:
        normalized_url = server.url.rstrip('/')
        if connection_type == "sse":
            if normalized_url.endswith('/mcp'):
                normalized_url = normalized_url[:-4] + '/sse'
            elif not normalized_url.endswith('/sse'):
                normalized_url = normalized_url.rstrip('/') + '/sse'
        else:  # http
            if normalized_url.endswith('/sse'):
                normalized_url = normalized_url[:-4]
            if not normalized_url.endswith('/mcp'):
                normalized_url = normalized_url.rstrip('/') + '/mcp'
    
    # Test connection before saving
    connection_ok, connection_message = await test_mcp_connection(
        normalized_url,
        connection_type=connection_type,
        api_key=server.api_key if server.api_key else None,
        headers=server.headers if server.headers else None,
        timeout=5.0
    )
    
    if not connection_ok:
        raise HTTPException(
            status_code=400,
            detail=f"Connection test failed: {connection_message}. Please fix the configuration before saving."
        )
        
    new_server = MCPServer(
        user_id=None,  # Global server
        name=server.name,
        url=normalized_url,
        connection_type=connection_type,
        enabled=True
    )
    
    new_server.set_api_key(server.api_key)
    new_server.set_headers(server.headers)
    
    db.add(new_server)
    db.commit()
    db.refresh(new_server)
    
    return {"status": "success", "server": new_server.to_dict(), "test_message": connection_message}

@router.get("/global-config/llm")
async def list_global_llm_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """List all global LLM configurations (superadmin only) - includes auto-initialized configs"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Get ALL global LLM configs (user_id=None, backward compatible with user_id=1)
    configs = db.query(LLMConfig).filter(
        LLMConfig.user_id.is_(None) | (LLMConfig.user_id == 1)  # Prioritize None, support legacy ID=1
    ).order_by(
        LLMConfig.is_default.desc(),  # Default configs first
        LLMConfig.active.desc(),       # Then active configs
        LLMConfig.created_at.desc()     # Then newest first
    ).all()
    
    # Load user preferences for global LLM configs (if user is authenticated)
    user_preferences = {}
    user_id = current_user.id if current_user else None
    if user_id:
        preferences = db.query(UserGlobalConfigPreference).filter(
            UserGlobalConfigPreference.user_id == user_id,
            UserGlobalConfigPreference.config_type == "llm"
        ).all()
        for pref in preferences:
            user_preferences[pref.config_id] = pref.enabled
    
    # Convert to dict format for frontend
    config_dicts = []
    for config in configs:
        config_dict = config.to_dict(include_api_key=False)
        config_dict['user_id'] = config.user_id  # Should be 1 or None for global configs
        config_dict['is_global'] = True  # Mark as global
        
        # Add user preference for global configs
        if user_id:
            # Check if user has a preference, default to True (enabled) if no preference exists
            config_dict['user_enabled'] = user_preferences.get(config.id, True)
        else:
            config_dict['user_enabled'] = config.active  # For unauthenticated, use global active status
        
        config_dicts.append(config_dict)
    
    return {"status": "success", "configs": config_dicts}

@router.put("/global-config/llm/{config_id}")
async def update_global_llm_config(
    config_id: int,
    config: GlobalLLMConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Update a global LLM configuration (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    llm_config = db.query(LLMConfig).filter(
        LLMConfig.id == config_id,
        (LLMConfig.user_id.is_(None) | (LLMConfig.user_id == 1))  # Global configs: None or legacy ID=1
    ).first()
    if not llm_config:
        raise HTTPException(status_code=404, detail="Global LLM config not found")
    
    # Migrate legacy configs (user_id=1) to user_id=None for consistency
    # Ensure it stays global
    if llm_config.user_id is not None and llm_config.user_id != 1:
        # If it was somehow assigned to a specific user, make it global
        llm_config.user_id = None
    elif llm_config.user_id == 1:
        # Migrate legacy ID=1 to None for consistency
        llm_config.user_id = None
    
    # If setting this as default, unset other global defaults first
    if config.is_default:
        db.query(LLMConfig).filter(
            (LLMConfig.user_id.is_(None) | (LLMConfig.user_id == 1)),  # Global configs: None or legacy ID=1
            LLMConfig.id != config_id,
            LLMConfig.is_default == True
        ).update({LLMConfig.is_default: False})
    
    llm_config.type = config.type
    llm_config.model = config.model
    llm_config.base_url = config.base_url
    llm_config.is_default = config.is_default  # Only superadmin can set this via this endpoint
    
    if config.api_key:
        from src.utils.encryption import encrypt_value
        llm_config.api_key = encrypt_value(config.api_key)
    
    db.commit()
    db.refresh(llm_config)
    
    return {"status": "success", "config": llm_config.to_dict()}

@router.delete("/global-config/llm/{config_id}")
async def delete_global_llm_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Delete a global LLM configuration (superadmin only). 
    If deleting the default config, ensures another default exists or creates DeepSeek fallback."""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    llm_config = db.query(LLMConfig).filter(
        LLMConfig.id == config_id,
        ((LLMConfig.user_id == 1) | (LLMConfig.user_id.is_(None)))
    ).first()
    if not llm_config:
        raise HTTPException(status_code=404, detail="Global LLM config not found")
    
    was_default = llm_config.is_default
    
    # Delete the config
    db.delete(llm_config)
    db.commit()
    
    # If we deleted the default config, ensure another default exists
    if was_default:
        # Check if any other default global config exists (user_id=1 or None)
        remaining_default = db.query(LLMConfig).filter(
            ((LLMConfig.user_id == 1) | (LLMConfig.user_id.is_(None))),
            LLMConfig.is_default == True
        ).first()
        
        if not remaining_default:
            # No default exists - create DeepSeek fallback or set first available as default
            import os
            deepseek_api_key = os.getenv("DEEPSEEK_KEY")
            
            # Try to find existing DeepSeek config
            deepseek_config = db.query(LLMConfig).filter(
                ((LLMConfig.user_id == 1) | (LLMConfig.user_id.is_(None))),
                LLMConfig.type == "deepseek",
                LLMConfig.model == "deepseek-chat"
            ).first()
            
            if deepseek_config:
                # Set existing DeepSeek as default
                deepseek_config.is_default = True
                deepseek_config.active = True
                if deepseek_api_key:
                    from src.utils.encryption import encrypt_value
                    deepseek_config.api_key = encrypt_value(deepseek_api_key)
                # Ensure it's owned by superadmin
                # Ensure it's global
                if deepseek_config.user_id is not None:
                    deepseek_config.user_id = None
                db.commit()
            elif deepseek_api_key:
                # Create new DeepSeek default config (encrypt API key)
                from src.utils.encryption import encrypt_value
                new_default = LLMConfig(
                    type="deepseek",
                    model="deepseek-chat",
                    api_key=encrypt_value(deepseek_api_key),
                    api_base="https://api.deepseek.com",
                    active=True,
                    is_default=True,
                    user_id=None  # Global config
                )
                db.add(new_default)
                db.commit()
            else:
                # No DeepSeek API key - set first available global config as default
                first_global = db.query(LLMConfig).filter(
                    ((LLMConfig.user_id == 1) | (LLMConfig.user_id.is_(None))),
                    LLMConfig.active == True
                ).order_by(LLMConfig.created_at.asc()).first()
                
                if first_global:
                    first_global.is_default = True
                    # Migrate to user_id=1 if needed
                    if first_global.user_id is not None:
                        first_global.user_id = None
                    db.commit()
    
    return {"status": "success", "message": "Global LLM config deleted"}

@router.patch("/global-config/llm/{config_id}/toggle")
async def toggle_global_llm_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Toggle active status of a global LLM configuration (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    llm_config = db.query(LLMConfig).filter(
        LLMConfig.id == config_id,
        ((LLMConfig.user_id == 1) | (LLMConfig.user_id.is_(None)))
    ).first()
    if not llm_config:
        raise HTTPException(status_code=404, detail="Global LLM config not found")
    
    # Migrate old configs (user_id=None) to user_id=1
    if llm_config.user_id is not None:
        llm_config.user_id = None
    
    llm_config.active = not llm_config.active
    db.commit()
    db.refresh(llm_config)
    
    return {"status": "success", "config": llm_config.to_dict()}

@router.get("/global-config/mcp")
async def list_global_mcp_servers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """List all global MCP servers (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from src.core.models import MCPServer
    servers = db.query(MCPServer).filter(
        (MCPServer.user_id == 1) | (MCPServer.user_id.is_(None))
    ).order_by(MCPServer.created_at.desc()).all()
    return {"status": "success", "servers": [s.to_dict() for s in servers]}

@router.put("/global-config/mcp/{server_id}")
async def update_global_mcp_server(
    server_id: int,
    server: GlobalMCPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Update a global MCP server (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from src.core.models import MCPServer
    
    mcp_server = db.query(MCPServer).filter(
        MCPServer.id == server_id,
        ((MCPServer.user_id == 1) | (MCPServer.user_id.is_(None)))
    ).first()
    if not mcp_server:
        raise HTTPException(status_code=404, detail="Global MCP server not found")
    
    # Migrate old configs (user_id=None) to user_id=1
    if mcp_server.user_id is not None:
        mcp_server.user_id = None
    
    # Check if name already exists globally (excluding current server)
    existing = db.query(MCPServer).filter(
        ((MCPServer.user_id == 1) | (MCPServer.user_id.is_(None))),
        MCPServer.name == server.name,
        MCPServer.id != server_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Global MCP server with this name already exists")
    
    mcp_server.name = server.name
    mcp_server.url = server.url
    mcp_server.connection_type = server.connection_type
    mcp_server.set_api_key(server.api_key)
    mcp_server.set_headers(server.headers)
    
    db.commit()
    db.refresh(mcp_server)
    
    return {"status": "success", "server": mcp_server.to_dict()}

@router.delete("/global-config/mcp/{server_id}")
async def delete_global_mcp_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Delete a global MCP server (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import MCPServer
    
    server = db.query(MCPServer).filter(
        MCPServer.id == server_id,
        ((MCPServer.user_id == 1) | (MCPServer.user_id.is_(None)))
    ).first()
    if not server:
        raise HTTPException(status_code=404, detail="Global MCP server not found")
        
    db.delete(server)
    db.commit()
    
    return {"status": "success", "message": "Global MCP server deleted"}

@router.patch("/global-config/mcp/{server_id}/toggle")
async def toggle_global_mcp_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Toggle enabled status of a global MCP server (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from src.core.models import MCPServer
    
    server = db.query(MCPServer).filter(
        MCPServer.id == server_id,
        ((MCPServer.user_id == 1) | (MCPServer.user_id.is_(None)))
    ).first()
    if not server:
        raise HTTPException(status_code=404, detail="Global MCP server not found")
    
    # Migrate old configs (user_id=None) to user_id=1
    if server.user_id is not None:
        server.user_id = None
    
    server.enabled = not server.enabled
    db.commit()
    db.refresh(server)
    
    return {"status": "success", "server": server.to_dict()}

# --- Global Embedding Configuration Routes ---

async def test_embedding_config(provider: str, model: str, api_key: str, base_url: Optional[str] = None) -> tuple[bool, str]:
    """Test embedding configuration by making a simple API call."""
    try:
        if provider.lower() == "openai":
            from langchain_openai import OpenAIEmbeddings
            
            embeddings = OpenAIEmbeddings(
                model=model,
                openai_api_key=api_key,
                openai_api_base=base_url if base_url else None
            )
            
            # Test with a simple text
            test_text = "test"
            result = await embeddings.aembed_query(test_text)
            
            if result and len(result) > 0:
                return True, "Embedding configuration is valid and working"
            else:
                return False, "Embedding API responded but with empty result"
        else:
            # For other providers, we can add support later
            # For now, just check if API key is provided
            if not api_key:
                return False, f"API key is required for {provider} provider"
            # If API key is provided, assume it's valid (can't test without provider-specific implementation)
            return True, f"{provider} embedding configuration accepted (not tested - provider-specific test not implemented)"
    except Exception as e:
        error_msg = str(e).lower()
        if "api key" in error_msg or "authentication" in error_msg or "401" in error_msg or "403" in error_msg:
            return False, f"Invalid API key or authentication failed: {str(e)[:200]}"
        elif "not found" in error_msg or "404" in error_msg:
            return False, f"Model not found or not available: {str(e)[:200]}"
        elif "connection" in error_msg or "timeout" in error_msg:
            return False, f"Connection error: {str(e)[:200]}"
        else:
            return False, f"Test failed: {str(e)[:200]}"


@router.post("/global-config/embedding")
async def create_global_embedding_config(
    config: GlobalEmbeddingConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Create a global embedding configuration (superadmin only). Only superadmin can set is_default."""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")

    # Test configuration before saving
    test_message = None
    if config.api_key:
        test_success, test_message = await test_embedding_config(
            config.provider,
            config.model,
            config.api_key,
            config.base_url
        )
        if not test_success:
            raise HTTPException(
                status_code=400,
                detail=f"Configuration test failed: {test_message}. Please fix the configuration before saving."
            )

    # If setting this as default, unset other global defaults first
    if config.is_default:
        db.query(EmbeddingConfig).filter(
            ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None))),
            EmbeddingConfig.is_default == True
        ).update({EmbeddingConfig.is_default: False})

    # Create new config with user_id = None (global)
    new_config = EmbeddingConfig(
        user_id=None,
        provider=config.provider,
        model=config.model,
        base_url=config.base_url,
        is_default=config.is_default
    )
    
    if config.api_key:
        from src.utils.encryption import encrypt_value
        new_config.api_key = encrypt_value(config.api_key)
        
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    
    return {"status": "success", "config": new_config.to_dict(), "test_message": test_message}


@router.patch("/global-config/embedding/{config_id}/toggle-preference")
async def toggle_global_embedding_config_preference(
    config_id: int,
    current_user: Optional[User] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Toggle user's personal preference for a global embedding configuration (enable/disable for personal use).
    This does not affect the global config's status, only the user's personal preference.
    """
    try:
        user_id = current_user.id if current_user else None
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        from src.core.models import UserGlobalConfigPreference, EmbeddingConfig
        from sqlalchemy import or_
        
        # Verify the config is a global config
        embedding_config = db.query(EmbeddingConfig).filter(
            EmbeddingConfig.id == config_id,
            or_(EmbeddingConfig.user_id == 1, EmbeddingConfig.user_id.is_(None))
        ).first()
        
        if not embedding_config:
            raise HTTPException(
                status_code=404,
                detail="Global embedding configuration not found"
            )
        
        # Get or create user preference
        preference = db.query(UserGlobalConfigPreference).filter(
            UserGlobalConfigPreference.user_id == user_id,
            UserGlobalConfigPreference.config_type == "embedding",
            UserGlobalConfigPreference.config_id == config_id
        ).first()
        
        if preference:
            # Toggle existing preference
            preference.enabled = not preference.enabled
        else:
            # Create new preference (default to enabled)
            preference = UserGlobalConfigPreference(
                user_id=user_id,
                config_type="embedding",
                config_id=config_id,
                enabled=True
            )
            db.add(preference)
        
        db.commit()
        db.refresh(preference)
        
        status = "enabled" if preference.enabled else "disabled"
        return {
            "status": "success",
            "message": f"Global embedding configuration {status} for your profile",
            "preference": preference.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to toggle global embedding config preference: {str(e)}")


@router.get("/global-config/embedding")
async def list_global_embedding_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """List all global embedding configurations (superadmin only) - includes auto-initialized configs"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Get ALL global embedding configs (user_id=1 or None for backward compatibility)
    configs = db.query(EmbeddingConfig).filter(
        (EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None))
    ).order_by(
        EmbeddingConfig.is_default.desc(),  # Default configs first
        EmbeddingConfig.active.desc(),       # Then active configs
        EmbeddingConfig.created_at.desc()     # Then newest first
    ).all()
    
    # Load user preferences for global embedding configs (if user is authenticated)
    user_preferences = {}
    user_id = current_user.id if current_user else None
    if user_id:
        preferences = db.query(UserGlobalConfigPreference).filter(
            UserGlobalConfigPreference.user_id == user_id,
            UserGlobalConfigPreference.config_type == "embedding"
        ).all()
        for pref in preferences:
            user_preferences[pref.config_id] = pref.enabled
    
    # Convert to dict format for frontend
    config_dicts = []
    for config in configs:
        config_dict = config.to_dict(include_api_key=False)
        config_dict['user_id'] = config.user_id  # Should be 1 or None for global configs
        config_dict['is_global'] = True  # Mark as global
        
        # Add user preference for global configs
        if user_id:
            # Check if user has a preference, default to True (enabled) if no preference exists
            config_dict['user_enabled'] = user_preferences.get(config.id, True)
        else:
            config_dict['user_enabled'] = config.active  # For unauthenticated, use global active status
        
        config_dicts.append(config_dict)
    
    return {"status": "success", "configs": config_dicts}

@router.put("/global-config/embedding/{config_id}")
async def update_global_embedding_config(
    config_id: int,
    config: GlobalEmbeddingConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Update a global embedding configuration (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    embedding_config = db.query(EmbeddingConfig).filter(
        EmbeddingConfig.id == config_id,
        ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None)))
    ).first()
    if not embedding_config:
        raise HTTPException(status_code=404, detail="Global embedding config not found")
    
    # Migrate old configs (user_id=None) to user_id=1
    # Ensure global semantics
    if embedding_config.user_id is not None:
        embedding_config.user_id = None
    
    # If setting this as default, unset other global defaults first
    if config.is_default:
        db.query(EmbeddingConfig).filter(
            ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None))),
            EmbeddingConfig.id != config_id,
            EmbeddingConfig.is_default == True
        ).update({EmbeddingConfig.is_default: False})
    
    embedding_config.provider = config.provider
    embedding_config.model = config.model
    embedding_config.base_url = config.base_url
    embedding_config.is_default = config.is_default
    
    if config.api_key:
        from src.utils.encryption import encrypt_value
        embedding_config.api_key = encrypt_value(config.api_key)
    # If api_key is not provided, keep existing API key (don't clear it)
    
    db.commit()
    db.refresh(embedding_config)
    
    return {"status": "success", "config": embedding_config.to_dict()}

@router.delete("/global-config/embedding/{config_id}")
async def delete_global_embedding_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Delete a global embedding configuration (superadmin only). 
    If deleting the default config, ensures another default exists or creates OpenAI fallback."""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    embedding_config = db.query(EmbeddingConfig).filter(
        EmbeddingConfig.id == config_id,
        ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None)))
    ).first()
    if not embedding_config:
        raise HTTPException(status_code=404, detail="Global embedding config not found")
    
    was_default = embedding_config.is_default
    
    # Delete the config
    db.delete(embedding_config)
    db.commit()
    
    # If we deleted the default config, ensure another default exists
    if was_default:
        # Check if any other default global config exists (user_id=1 or None)
        remaining_default = db.query(EmbeddingConfig).filter(
            ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None))),
            EmbeddingConfig.is_default == True
        ).first()
        
        if not remaining_default:
            # No default exists - create OpenAI fallback or set first available as default
            import os
            openai_api_key = os.getenv("OPENAI_API_KEY")
            
            # Try to find existing OpenAI config
            openai_config = db.query(EmbeddingConfig).filter(
                ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None))),
                EmbeddingConfig.provider == "openai",
                EmbeddingConfig.model == "text-embedding-3-small"
            ).first()
            
            if openai_config:
                # Set existing OpenAI as default
                openai_config.is_default = True
                openai_config.active = True
                if openai_api_key:
                    from src.utils.encryption import encrypt_value
                    openai_config.api_key = encrypt_value(openai_api_key)
                # Ensure it's owned by superadmin
                # Ensure it's global
                if openai_config.user_id is not None:
                    openai_config.user_id = None
                db.commit()
            elif openai_api_key:
                # Create new OpenAI default config (encrypt API key)
                from src.utils.encryption import encrypt_value
                new_default = EmbeddingConfig(
                    provider="openai",
                    model="text-embedding-3-small",
                    api_key=encrypt_value(openai_api_key),
                    base_url=None,
                    active=True,
                    is_default=True,
                    user_id=None  # Global config
                )
                db.add(new_default)
                db.commit()
            else:
                # No OpenAI API key - set first available global config as default
                first_global = db.query(EmbeddingConfig).filter(
                    ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None))),
                    EmbeddingConfig.active == True
                ).order_by(EmbeddingConfig.created_at.asc()).first()
                
                if first_global:
                    first_global.is_default = True
                    # Migrate to user_id=1 if needed
                    if first_global.user_id is not None:
                        first_global.user_id = None
                    db.commit()
    
    return {"status": "success", "message": "Global embedding config deleted"}

@router.patch("/global-config/embedding/{config_id}/toggle")
async def toggle_global_embedding_config(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Toggle active status of a global embedding configuration (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    embedding_config = db.query(EmbeddingConfig).filter(
        EmbeddingConfig.id == config_id,
        ((EmbeddingConfig.user_id == 1) | (EmbeddingConfig.user_id.is_(None)))
    ).first()
    if not embedding_config:
        raise HTTPException(status_code=404, detail="Global embedding config not found")
    
    # Migrate old configs (user_id=None) to user_id=1
    if embedding_config.user_id is None:
        embedding_config.user_id = 1
    
    embedding_config.active = not embedding_config.active
    db.commit()
    db.refresh(embedding_config)
    
    return {"status": "success", "config": embedding_config.to_dict()}

# --- User Inspection & Enhanced Management ---

@router.delete("/users/{user_id}")
async def delete_user_permanently(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Permanently delete a user and all their data (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user_to_delete = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    if hasattr(user_to_delete, 'role') and user_to_delete.role == "superadmin":
        raise HTTPException(status_code=400, detail="Cannot delete superadmin user")
        
    db.delete(user_to_delete)
    db.commit()
    
    return {"status": "success", "message": f"User {user_to_delete.name} permanently deleted"}

@router.get("/users/{user_id}/sessions")
async def get_user_sessions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Get all chat sessions for a specific user (superadmin only - admin cannot access user chats)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import Conversation
    
    sessions = db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc()).all()
    return [session.to_dict() for session in sessions]

@router.get("/users/{user_id}/sessions/{session_id}/messages")
async def get_user_session_messages(
    user_id: int,
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Get messages for a specific user session (superadmin only - admin cannot access user chats)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import Conversation
    
    # Verify session belongs to user
    conversation = db.query(Conversation).filter(
        Conversation.user_id == user_id, 
        Conversation.session_id == session_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found for this user")
        
    return [msg.to_dict() for msg in conversation.messages]

@router.get("/users/{user_id}/details")
async def get_user_details(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Get comprehensive user details (stats, configs, etc.) - Superadmin only (admin cannot access user data)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Gather stats
    chat_count = len(user.conversations)
    doc_count = len(user.documents)
    mcp_count = len(user.mcp_servers)
    
    return {
        "profile": user.to_dict(),
        "stats": {
            "chats": chat_count,
            "documents": doc_count,
            "mcp_servers": mcp_count
        },
        "mcp_servers": [s.to_dict() for s in user.mcp_servers],
        "llm_configs": [c.to_dict() for c in user.llm_configs]
    }


# --- System Analytics ---

@router.get("/analytics/activity")
async def get_system_activity(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """Get recent system activity log (admin or superadmin)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import APIRequest, User as UserModel
    
    # query API requests and join with user to get names
    # activity is essentially API requests for now, but in future could be a dedicated EventLog
    requests = db.query(APIRequest).order_by(APIRequest.created_at.desc()).limit(limit).all()
    
    activity = []
    for req in requests:
        user_name = "Anonymous"
        if req.user_id:
            user = db.query(UserModel).filter(UserModel.id == req.user_id).first()
            if user:
                user_name = user.name
        elif hasattr(req, 'guest_email') and req.guest_email:
            user_name = f"Guest ({req.guest_email})"
                
        activity.append({
            "id": req.id,
            "user": user_name,
            "action": f"Used {req.llm_model or 'System'}",
            "details": f"Tokens: {req.total_tokens}",
            "time": req.created_at.isoformat() if req.created_at else None,
            "status": "success" if req.success else "failed"
        })
        
    return activity

@router.get("/analytics/usage")
async def get_usage_analytics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """Get aggregated token usage analytics (admin or superadmin)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import APIUsage
    from datetime import datetime, timedelta
    
    cutoff = datetime.now() - timedelta(days=days)
    
    # Aggregate daily usage
    daily_stats = db.query(
        APIUsage.usage_date,
        func.sum(APIUsage.input_tokens + APIUsage.output_tokens + APIUsage.embedding_tokens).label('total_tokens'),
        func.sum(APIUsage.input_tokens).label('input_tokens'),
        func.sum(APIUsage.output_tokens).label('output_tokens'),
        func.sum(APIUsage.request_count).label('request_count')
    ).filter(
        APIUsage.usage_date >= cutoff
    ).group_by(
        APIUsage.usage_date
    ).order_by(
        APIUsage.usage_date
    ).all()
    
    return [
        {
            "date": stat.usage_date.isoformat().split('T')[0],
            "tokens": int(stat.total_tokens or 0),
            "input_tokens": int(stat.input_tokens or 0),
            "output_tokens": int(stat.output_tokens or 0),
            "requests": int(stat.request_count or 0)
        }
        for stat in daily_stats
    ]

@router.get("/analytics/models")
async def get_model_usage_analytics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """Get model usage distribution (admin or superadmin)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import APIUsage
    from datetime import datetime, timedelta
    
    cutoff = datetime.now() - timedelta(days=days)
    
    # Aggregate by model
    model_stats = db.query(
        APIUsage.llm_model,
        func.sum(APIUsage.request_count).label('request_count')
    ).filter(
        APIUsage.usage_date >= cutoff
    ).group_by(
        APIUsage.llm_model
    ).order_by(
        func.sum(APIUsage.request_count).desc()
    ).all()
    
    return [
        {
            "name": stat.llm_model or "Unknown",
            "value": int(stat.request_count or 0)
        }
        for stat in model_stats
    ]

@router.get("/analytics/top-users")
async def get_top_users_analytics(
    limit: int = 5,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_superadmin)
):
    """Get top users by token consumption (admin or superadmin)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
        
    from src.core.models import APIUsage, User as UserModel
    from datetime import datetime, timedelta
    
    cutoff = datetime.now() - timedelta(days=days)
    
    # 1. Authenticated users
    user_stats = db.query(
        APIUsage.user_id,
        func.sum(APIUsage.input_tokens + APIUsage.output_tokens + APIUsage.embedding_tokens).label('total_tokens')
    ).filter(
        APIUsage.usage_date >= cutoff,
        APIUsage.user_id.isnot(None)
    ).group_by(
        APIUsage.user_id
    ).order_by(
        func.sum(APIUsage.input_tokens + APIUsage.output_tokens + APIUsage.embedding_tokens).desc()
    ).limit(limit).all()

    # 2. Guest users
    guest_stats = db.query(
        APIUsage.guest_email,
        func.sum(APIUsage.input_tokens + APIUsage.output_tokens + APIUsage.embedding_tokens).label('total_tokens')
    ).filter(
        APIUsage.usage_date >= cutoff,
        APIUsage.user_id.is_(None),
        APIUsage.guest_email.isnot(None)
    ).group_by(
        APIUsage.guest_email
    ).order_by(
        func.sum(APIUsage.input_tokens + APIUsage.output_tokens + APIUsage.embedding_tokens).desc()
    ).limit(limit).all()
    
    # Process authenticated users
    result = []
    for stat in user_stats:
        user = db.query(UserModel).filter(UserModel.id == stat.user_id).first()
        if user:
            result.append({
                "name": user.name,
                "email": user.email,
                "tokens": int(stat.total_tokens or 0)
            })

    # Process guest users
    for stat in guest_stats:
        result.append({
            "name": f"Guest ({stat.guest_email})",
            "email": stat.guest_email,
            "tokens": int(stat.total_tokens or 0)
        })
    
    # Sort combined results and take top N
    result.sort(key=lambda x: x["tokens"], reverse=True)
    return result[:limit]


# --- User Appeals Management ---

class AppealRequest(BaseModel):
    message: str

class AppealResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    message: str
    status: str
    admin_response: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/appeals", response_model=AppealResponse)
async def create_appeal(
    appeal: AppealRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an appeal/message from a blocked user to superadmin"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Only blocked users can create appeals
    if current_user.is_active:
        raise HTTPException(status_code=400, detail="Only blocked users can create appeals")
    
    from sqlalchemy.orm import joinedload
    
    new_appeal = UserAppeal(
        user_id=current_user.id,
        message=appeal.message,
        status="pending"
    )
    db.add(new_appeal)
    db.commit()
    db.refresh(new_appeal)
    
    # Reload with relationships to get user info
    appeal_with_user = db.query(UserAppeal).options(
        joinedload(UserAppeal.user),
        joinedload(UserAppeal.reviewer)
    ).filter(UserAppeal.id == new_appeal.id).first()
    
    return appeal_with_user.to_dict() if appeal_with_user else new_appeal.to_dict()


@router.get("/appeals", response_model=List[AppealResponse])
async def list_appeals(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """List all user appeals (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from sqlalchemy.orm import joinedload
    
    query = db.query(UserAppeal).options(
        joinedload(UserAppeal.user),
        joinedload(UserAppeal.reviewer)
    )
    
    if status:
        query = query.filter(UserAppeal.status == status)
    
    appeals = query.order_by(UserAppeal.created_at.desc()).all()
    return [appeal.to_dict() for appeal in appeals]


@router.get("/appeals/{appeal_id}", response_model=AppealResponse)
async def get_appeal(
    appeal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Get a specific appeal (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from sqlalchemy.orm import joinedload
    
    appeal = db.query(UserAppeal).options(
        joinedload(UserAppeal.user),
        joinedload(UserAppeal.reviewer)
    ).filter(UserAppeal.id == appeal_id).first()
    
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    
    return appeal.to_dict()


@router.put("/appeals/{appeal_id}/respond")
async def respond_to_appeal(
    appeal_id: int,
    response: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    """Respond to an appeal (superadmin only)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    appeal = db.query(UserAppeal).filter(UserAppeal.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
    
    appeal.admin_response = response.get("admin_response", "")
    appeal.status = response.get("status", "reviewed")
    appeal.reviewed_by = current_user.id
    appeal.reviewed_at = func.now()
    
    db.commit()
    db.refresh(appeal)
    
    return {"status": "success", "appeal": appeal.to_dict()}


# --- Notifications Management ---

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str  # 'info' | 'success' | 'warning' | 'error'
    timestamp: str
    read: bool
    link: Optional[str] = None
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """Get notifications for the current user based on their role (all authenticated users)"""
    if not DB_AVAILABLE:
        raise HTTPException(status_code=503, detail="Database not available")
    
    if not current_user:
        # Return empty for unauthenticated users
        return []
    
    notifications = []
    user_role = getattr(current_user, 'role', 'user')
    is_admin = user_role in ['admin', 'superadmin']
    is_superadmin = user_role == 'superadmin'
    
    from datetime import datetime, timedelta
    from sqlalchemy.orm import joinedload
    
    # 1. User Appeals (for admin/superadmin only)
    if is_admin:
        pending_appeals = db.query(UserAppeal).options(
            joinedload(UserAppeal.user)
        ).filter(
            UserAppeal.status == "pending"
        ).order_by(UserAppeal.created_at.desc()).limit(10).all()
        
        for appeal in pending_appeals:
            notifications.append({
                "id": f"appeal_{appeal.id}",
                "title": "New User Appeal",
                "message": f"User {appeal.user.name if appeal.user else 'Unknown'} has submitted an appeal: {appeal.message[:100]}...",
                "type": "warning",
                "timestamp": appeal.created_at.isoformat() if appeal.created_at else datetime.now().isoformat(),
                "read": False,
                "link": f"/admin?tab=appeals&appeal={appeal.id}",
                "metadata": {"appeal_id": appeal.id, "user_id": appeal.user_id}
            })
    
    # 2. Usage Warnings (for all users)
    try:
        from src.core.constants import DAILY_REQUEST_LIMIT
        
        # Get today's usage
        today_usage_data = usage_tracker.get_user_usage_stats(current_user.id, db, days=1)
        today_stats = today_usage_data.get("today", {})
        request_count = today_stats.get("request_count", 0)
        limit = DAILY_REQUEST_LIMIT if current_user else 100
        
        # Check if using default LLM
        from src.core import Config
        llm_config = Config.load_llm_config(db=db, user_id=current_user.id)
        is_default_llm = llm_config.get("is_default", False) if llm_config else True
        
        if is_default_llm and limit > 0:
            percentage = (request_count / limit) * 100
            
            # Warning at 80%
            if percentage >= 80 and percentage < 100:
                notifications.append({
                    "id": f"usage_warning_{current_user.id}",
                    "title": "High Usage Warning",
                    "message": f"You've used {request_count}/{limit} requests today ({int(percentage)}%). Consider upgrading or using your own API key.",
                    "type": "warning",
                    "timestamp": datetime.now().isoformat(),
                    "read": False,
                    "link": "/monitoring",
                    "metadata": {"request_count": request_count, "limit": limit}
                })
            
            # Error at 100%
            elif percentage >= 100:
                notifications.append({
                    "id": f"usage_limit_{current_user.id}",
                    "title": "Daily Limit Reached",
                    "message": f"You've reached your daily limit of {limit} requests. Please wait until tomorrow or configure your own API key.",
                    "type": "error",
                    "timestamp": datetime.now().isoformat(),
                    "read": False,
                    "link": "/monitoring",
                    "metadata": {"request_count": request_count, "limit": limit}
                })
    except Exception as e:
        # Silently fail - don't break notifications if usage check fails
        pass
    
    # 3. Account Status (for blocked users)
    if not current_user.is_active:
        notifications.append({
            "id": f"account_blocked_{current_user.id}",
            "title": "Account Blocked",
            "message": "Your account has been blocked. Please contact support or submit an appeal.",
            "type": "error",
            "timestamp": datetime.now().isoformat(),
            "read": False,
            "link": "/dashboard",
            "metadata": {"user_id": current_user.id}
        })
    
    # 4. System Alerts (for superadmin only)
    if is_superadmin:
        # Check for global config issues
        from src.core.models import LLMConfig, EmbeddingConfig
        
        # Check if there are any active default LLM configs
        active_default_llm = db.query(LLMConfig).filter(
            LLMConfig.user_id.is_(None),
            LLMConfig.active == True,
            LLMConfig.is_default == True
        ).first()
        
        if not active_default_llm:
            notifications.append({
                "id": "no_default_llm",
                "title": "No Default LLM Config",
                "message": "No active default LLM configuration found. Users may not be able to use LLM features.",
                "type": "warning",
                "timestamp": datetime.now().isoformat(),
                "read": False,
                "link": "/admin?tab=configure",
                "metadata": {"config_type": "llm"}
            })
        
        # Check for active default embedding configs
        active_default_embedding = db.query(EmbeddingConfig).filter(
            EmbeddingConfig.user_id.is_(None),
            EmbeddingConfig.active == True,
            EmbeddingConfig.is_default == True
        ).first()
        
        if not active_default_embedding:
            notifications.append({
                "id": "no_default_embedding",
                "title": "No Default Embedding Config",
                "message": "No active default embedding configuration found. RAG features may not work correctly.",
                "type": "warning",
                "timestamp": datetime.now().isoformat(),
                "read": False,
                "link": "/admin?tab=configure",
                "metadata": {"config_type": "embedding"}
            })
    
    # Sort by timestamp (newest first)
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Limit to 50 notifications
    return notifications[:50]


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark a notification as read (client-side only for now)"""
    # For now, this is a no-op since we're generating notifications dynamically
    # In the future, we could store read status in a database table
    return {"status": "success", "message": "Notification marked as read"}


@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications as read (client-side only for now)"""
    # For now, this is a no-op since we're generating notifications dynamically
    return {"status": "success", "message": "All notifications marked as read"}

