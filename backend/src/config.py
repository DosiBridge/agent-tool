"""
Configuration and environment management
Now uses PostgreSQL database instead of JSON files
"""
import os
import json
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not available, using environment variables directly")

# Import database models
try:
    from .database import get_db_context, DB_AVAILABLE as DB_AVAILABLE_FLAG
    if DB_AVAILABLE_FLAG:
        from .models import LLMConfig, MCPServer
        DB_AVAILABLE = True
    else:
        DB_AVAILABLE = False
        LLMConfig = None  # type: ignore
        MCPServer = None  # type: ignore
        print("⚠️  Database not available, falling back to JSON files")
except ImportError as e:
    print(f"⚠️  Database not available: {e}, falling back to JSON files")
    DB_AVAILABLE = False
    get_db_context = None  # type: ignore
    LLMConfig = None  # type: ignore
    MCPServer = None  # type: ignore


class Config:
    """Application configuration"""
    
    # OpenAI settings (deprecated - use LLM config file)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
    
    # MCP settings
    MCP_SERVERS_FILE = "config/mcp_servers.json"
    MCP_SERVERS_ENV = os.getenv("MCP_SERVERS")
    
    # LLM settings
    LLM_CONFIG_FILE = "config/llm_config.json"
    
    # Project root
    ROOT_DIR = Path(__file__).parent.parent
    
    @classmethod
    def load_mcp_servers(cls, additional_servers: list = None, db: Optional[Session] = None) -> list[dict]:
        """
        Load MCP servers from database.
        Args:
            additional_servers: Optional list of additional servers to add
            db: Optional database session (if None, creates a new one)
        """
        servers = []
        
        # Load from database
        if DB_AVAILABLE:
            try:
                if db:
                    # Use provided session
                    db_servers = db.query(MCPServer).filter(MCPServer.enabled == True).all()
                    servers = [s.to_dict() for s in db_servers]
                else:
                    # Create new session
                    with get_db_context() as session:
                        db_servers = session.query(MCPServer).filter(MCPServer.enabled == True).all()
                        servers = [s.to_dict() for s in db_servers]
                
                if servers:
                    print(f"📝 Loaded {len(servers)} server(s) from database")
            except Exception as e:
                print(f"⚠️  Failed to load MCP servers from database: {e}")
                servers = []
        
        # Check environment variable as fallback
        if not servers and cls.MCP_SERVERS_ENV:
            try:
                env_servers = json.loads(cls.MCP_SERVERS_ENV)
                servers.extend(env_servers)
                print(f"📝 Loaded {len(env_servers)} server(s) from MCP_SERVERS env variable")
            except json.JSONDecodeError as e:
                print(f"⚠️  Failed to parse MCP_SERVERS env variable: {e}")
        
        # No servers configured
        if not servers:
            print("📝 No MCP servers configured - agent will use local tools only")
        
        # Add any additional servers passed as argument
        if additional_servers:
            servers.extend(additional_servers)
            print(f"📝 Added {len(additional_servers)} additional server(s)")
        
        return servers
    
    @classmethod
    def load_llm_config(cls, db: Optional[Session] = None) -> dict:
        """
        Load LLM configuration from database.
        Returns default Gemini config (gemini-2.0-flash) if nothing is found.
        Note: OPENAI_API_KEY from env is ONLY for embeddings (RAG), not for LLM model.
        The default gemini-2.0-flash config cannot be deleted - it's always available via reset.
        Args:
            db: Optional database session (if None, creates a new one)
        """
        # Load from database
        if DB_AVAILABLE:
            try:
                if db:
                    # Use provided session - extract data while session is active
                    llm_config = db.query(LLMConfig).filter(LLMConfig.active == True).first()
                    if llm_config:
                        # Extract data while session is active
                        config = llm_config.to_dict(include_api_key=True)
                        # Ensure API key is loaded from environment if not in database
                        if not config.get('api_key'):
                            if config.get('type', '').lower() == 'gemini':
                                config['api_key'] = os.getenv("GOOGLE_API_KEY")
                            elif config.get('type', '').lower() == 'openai':
                                # For OpenAI, use a separate key if available, otherwise use embeddings key
                                config['api_key'] = os.getenv("OPENAI_LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
                            elif config.get('type', '').lower() == 'groq':
                                config['api_key'] = os.getenv("GROQ_API_KEY")
                        
                        print(f"📝 Loaded LLM config from database: {config.get('type', 'gemini')} - {config.get('model', 'unknown')}")
                        return config
                else:
                    # Create new session
                    with get_db_context() as session:
                        llm_config = session.query(LLMConfig).filter(LLMConfig.active == True).first()
                        if llm_config:
                            # Extract data while session is active
                            config = llm_config.to_dict(include_api_key=True)
                            # Ensure API key is loaded from environment if not in database
                            if not config.get('api_key'):
                                if config.get('type', '').lower() == 'gemini':
                                    config['api_key'] = os.getenv("GOOGLE_API_KEY")
                                elif config.get('type', '').lower() == 'openai':
                                    # For OpenAI, use a separate key if available, otherwise use embeddings key
                                    config['api_key'] = os.getenv("OPENAI_LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
                                elif config.get('type', '').lower() == 'groq':
                                    config['api_key'] = os.getenv("GROQ_API_KEY")
                            
                            print(f"📝 Loaded LLM config from database: {config.get('type', 'gemini')} - {config.get('model', 'unknown')}")
                            return config
            except Exception as e:
                print(f"⚠️  Failed to load LLM config from database: {e}")
        
        # Default to Gemini (not OpenAI)
        google_api_key = os.getenv("GOOGLE_API_KEY")
        default_config = {
            "type": "gemini",
            "model": "gemini-2.0-flash",
            "api_key": google_api_key,  # Get from environment (may be None)
            "active": True
        }
        
        # Warn if API key is missing
        if not default_config["api_key"]:
            print("⚠️  Warning: GOOGLE_API_KEY not set. Please set it as an environment variable or configure in database")
            print("   Set it with: export GOOGLE_API_KEY='your-api-key'")
            print("   Or configure it in the frontend Settings panel")
        
        return default_config
    
    @classmethod
    def save_llm_config(cls, config: dict, db: Optional[Session] = None) -> bool:
        """
        Save LLM configuration to database.
        Users can switch to any model/LLM, but the default gemini-2.0-flash config
        will always be preserved (just deactivated when switching).
        Args:
            config: Configuration dictionary
            db: Optional database session (if None, creates a new one)
        """
        if not DB_AVAILABLE:
            raise Exception("Database not available. Cannot save LLM config.")
        
        try:
            if db:
                # Use provided session (caller will commit)
                session = db
            else:
                # Create new session using context manager
                with get_db_context() as session:
                    # Deactivate all existing configs (they are preserved, just not active)
                    # This allows users to switch models while keeping history
                    session.query(LLMConfig).update({LLMConfig.active: False})
                    
                    # Create new active config with user's chosen model/LLM
                    llm_config = LLMConfig(
                        type=config.get('type', 'gemini'),
                        model=config.get('model', 'gemini-2.0-flash'),
                        api_key=config.get('api_key'),
                        base_url=config.get('base_url'),
                        api_base=config.get('api_base'),
                        active=True
                    )
                    session.add(llm_config)
                    # Context manager will commit automatically
                
                print(f"✓ LLM config saved to database: {config.get('type', 'unknown')} - {config.get('model', 'unknown')}")
                return True
            
            # If using provided session, update here (caller will commit)
            # Deactivate all existing configs (they are preserved, just not active)
            session.query(LLMConfig).update({LLMConfig.active: False})
            
            # Create new active config with user's chosen model/LLM
            llm_config = LLMConfig(
                type=config.get('type', 'gemini'),
                model=config.get('model', 'gemini-2.0-flash'),
                api_key=config.get('api_key'),
                base_url=config.get('base_url'),
                api_base=config.get('api_base'),
                active=True
            )
            session.add(llm_config)
            # Don't commit - caller handles it
            
            print(f"✓ LLM config saved to database: {config.get('type', 'unknown')} - {config.get('model', 'unknown')}")
            return True
        except Exception as e:
            print(f"⚠️  Failed to save LLM config to database: {e}")
            raise

