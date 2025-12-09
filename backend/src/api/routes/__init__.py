"""
API Routes
"""
from .chat import router as chat_router
from .sessions import router as sessions_router
from .tools import router as tools_router
from .mcp_servers import router as mcp_servers_router
from .llm_config import router as llm_config_router
from .mcp_routes import router as mcp_routes_router
from .auth import router as auth_router
from .admin import router as admin_router
from .mcp_routes import setup_mcp_routes

__all__ = [
    "chat_router",
    "sessions_router",
    "tools_router",
    "mcp_servers_router",
    "llm_config_router",
    "mcp_routes_router",
    "auth_router",
    "admin_router",
    "setup_mcp_routes",
]

