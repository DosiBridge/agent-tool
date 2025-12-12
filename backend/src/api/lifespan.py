"""
Lifespan management for FastAPI app
"""
import asyncio
import contextlib
import os
from sqlalchemy import and_, not_
from fastapi import FastAPI
from src.core import get_db_context, DB_AVAILABLE, init_db, LLMConfig
from src.core.models import User, EmbeddingConfig, MCPServer
from src.core.env_validation import validate_and_exit_on_error
# from src.core.auth import get_password_hash # Removed
from src.mcp import MCP_SERVERS
from src.utils import suppress_mcp_cleanup_errors


@contextlib.asynccontextmanager
async def mcp_lifespan(app: FastAPI):
    """Lifespan context manager for MCP servers"""
    # Validate environment variables on startup
    validate_and_exit_on_error()

    # Initialize database on startup
    try:
        init_db()
        print("✓ Database initialized")

        # Initialize global LLM and embedding configs from environment variables
        # Global configs use user_id=None
        try:
            if DB_AVAILABLE:
                with get_db_context() as db:
                    # Check if any active default global configs exist (user_id=None for global configs)
                    # We check for active defaults to allow re-initialization if configs were deleted or deactivated
                    active_default_llm = db.query(LLMConfig).filter(
                        LLMConfig.user_id.is_(None),  # Global configs use None
                        LLMConfig.active == True,
                        LLMConfig.is_default == True
                    ).first()

                    active_default_embedding = db.query(EmbeddingConfig).filter(
                        EmbeddingConfig.user_id.is_(None),  # Global configs use None
                        EmbeddingConfig.active == True,
                        EmbeddingConfig.is_default == True
                    ).first()

                    # Initialize LLM config if no active default exists
                    if not active_default_llm:
                        # Create default LLM config from environment
                        print("ℹ️  No active default global LLM config found. Initializing from environment variables...")

                        deepseek_api_key = os.getenv("DEEPSEEK_KEY")
                        if deepseek_api_key:
                            from src.utils.encryption import encrypt_value
                            # Unset any existing defaults first
                            db.query(LLMConfig).filter(
                                LLMConfig.user_id.is_(None),  # Global configs use None
                                LLMConfig.is_default == True
                            ).update({LLMConfig.is_default: False})

                            default_llm_config = LLMConfig(
                                user_id=None,  # Global configs use None (not tied to specific user ID)
                                type="deepseek",
                                model="deepseek-chat",
                                api_key=encrypt_value(deepseek_api_key),
                                api_base="https://api.deepseek.com",
                                active=True,
                                is_default=True  # Set as default for first init
                            )
                            db.add(default_llm_config)
                            try:
                                db.commit()
                                db.refresh(default_llm_config)
                                print(f"✓ Created default global LLM config: DeepSeek (deepseek-chat)")
                            except Exception as commit_error:
                                db.rollback()
                                print(f"⚠️  Failed to create default LLM config: {commit_error}")
                        else:
                            print("⚠️  DEEPSEEK_KEY not set. Please set DEEPSEEK_KEY environment variable to enable LLM features.")

                    # Initialize embedding config if no active default exists
                    if not active_default_embedding:
                        # Create default embedding config from environment
                        print("ℹ️  No active default global embedding config found. Initializing from environment variables...")

                        openai_api_key = os.getenv("OPENAI_API_KEY")
                        if openai_api_key:
                            from src.utils.encryption import encrypt_value
                            # Unset any existing defaults first
                            db.query(EmbeddingConfig).filter(
                                EmbeddingConfig.user_id.is_(None),  # Global configs use None
                                EmbeddingConfig.is_default == True
                            ).update({EmbeddingConfig.is_default: False})

                            default_embedding_config = EmbeddingConfig(
                                user_id=None,  # Global configs use None (not tied to specific user ID)
                                provider="openai",
                                model="text-embedding-3-small",
                                api_key=encrypt_value(openai_api_key),
                                active=True,
                                is_default=True  # Set as default for first init
                            )
                            db.add(default_embedding_config)
                            try:
                                db.commit()
                                db.refresh(default_embedding_config)
                                print(f"✓ Created default global embedding config: OpenAI (text-embedding-3-small)")
                            except Exception as commit_error:
                                db.rollback()
                                print(f"⚠️  Failed to create default embedding config: {commit_error}")
                        else:
                            print("⚠️  OPENAI_API_KEY not set. Please set OPENAI_API_KEY environment variable to enable embedding features.")

                    # Check status of existing configs (re-check after potential initialization)
                    # Also check for legacy configs with user_id=1 for migration purposes
                    global_llm_count = db.query(LLMConfig).filter(
                        LLMConfig.user_id.is_(None)  # Global configs use None
                    ).count()
                    # Count legacy configs with user_id=1 for migration info
                    legacy_llm_count = db.query(LLMConfig).filter(LLMConfig.user_id == 1).count()

                    global_embedding_count = db.query(EmbeddingConfig).filter(
                        EmbeddingConfig.user_id.is_(None)  # Global configs use None
                    ).count()
                    # Count legacy configs with user_id=1 for migration info
                    legacy_embedding_count = db.query(EmbeddingConfig).filter(EmbeddingConfig.user_id == 1).count()

                    if legacy_llm_count > 0 or legacy_embedding_count > 0:
                        print(f"ℹ️  Found {legacy_llm_count} legacy LLM config(s) and {legacy_embedding_count} legacy embedding config(s) with user_id=1.")
                        print("   These will continue to work but new global configs use user_id=None.")

                    if global_llm_count > 0:
                        active_default_llm_count = db.query(LLMConfig).filter(
                            LLMConfig.user_id.is_(None),  # Global configs use None
                            LLMConfig.active == True,
                            LLMConfig.is_default == True
                        ).count()
                        if active_default_llm_count == 0:
                            print("⚠️  No active default global LLM config found. Users may not be able to use LLM features.")
                        else:
                            print(f"✓ Found {global_llm_count} global LLM config(s), {active_default_llm_count} active default(s)")

                    if global_embedding_count > 0:
                        active_default_embedding_count = db.query(EmbeddingConfig).filter(
                            EmbeddingConfig.user_id.is_(None),  # Global configs use None
                            EmbeddingConfig.active == True,
                            EmbeddingConfig.is_default == True
                        ).count()
                        if active_default_embedding_count == 0:
                            print("⚠️  No active default global embedding config found.")
                        else:
                            print(f"✓ Found {global_embedding_count} global embedding config(s), {active_default_embedding_count} active default(s)")

                    print("   Global configs are initialized from environment variables on startup.")
        except Exception as e:
            print(f"⚠️  Could not initialize global configs: {e}")
            import traceback
            traceback.print_exc()
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

