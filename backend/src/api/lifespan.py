"""
Lifespan management for FastAPI app
"""
import asyncio
import contextlib
from fastapi import FastAPI
from src.database import get_db_context, DB_AVAILABLE, init_db
from src.models import LLMConfig
from mcp_servers.registry import MCP_SERVERS
from .utils import suppress_mcp_cleanup_errors


@contextlib.asynccontextmanager
async def mcp_lifespan(app: FastAPI):
    """Lifespan context manager for MCP servers"""
    # Initialize database on startup
    try:
        init_db()
        print("✓ Database initialized")
        
        # Ensure default Gemini config exists (cannot be deleted, always available)
        try:
            if DB_AVAILABLE:
                with get_db_context() as db:
                    # Check if any active config exists
                    existing_config = db.query(LLMConfig).filter(LLMConfig.active == True).first()
                    if not existing_config:
                        # Check if default gemini-2.0-flash config exists (even if inactive)
                        import os
                        google_api_key = os.getenv("GOOGLE_API_KEY")
                        default_existing = db.query(LLMConfig).filter(
                            LLMConfig.type == "gemini",
                            LLMConfig.model == "gemini-2.0-flash"
                        ).first()
                        
                        if default_existing:
                            # Reactivate the default config
                            default_existing.active = True
                            if google_api_key:
                                default_existing.api_key = google_api_key
                            db.commit()
                            print("✓ Reactivated default Gemini LLM configuration (gemini-2.0-flash)")
                        else:
                            # Create new default Gemini config
                            default_config = LLMConfig(
                                type="gemini",
                                model="gemini-2.0-flash",
                                api_key=google_api_key,  # Get from environment (may be None)
                                active=True
                            )
                            db.add(default_config)
                            db.commit()
                            if google_api_key:
                                print("✓ Created default Gemini LLM configuration (gemini-2.0-flash)")
                            else:
                                print("⚠️  Created default Gemini LLM configuration, but GOOGLE_API_KEY is not set in environment")
                                print("   Please set GOOGLE_API_KEY environment variable or configure API key in settings")
        except Exception as e:
            print(f"⚠️  Could not ensure default Gemini config exists: {e}")
    except Exception as e:
        print(f"⚠️  Failed to initialize database: {e}")
    
    # Set up exception handler to suppress MCP cleanup errors
    try:
        loop = asyncio.get_running_loop()
        loop.set_exception_handler(suppress_mcp_cleanup_errors)
    except Exception:
        # If we can't set the handler, that's okay - errors will still be logged
        pass
    
    async with contextlib.AsyncExitStack() as stack:
        # Enter all MCP server session managers
        for server in MCP_SERVERS.values():
            if hasattr(server, 'session_manager'):
                await stack.enter_async_context(server.session_manager.run())
        yield

