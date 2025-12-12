"""
Configuration Service - Refactored to use Repository Pattern
Following Service Layer Pattern and Repository Pattern
"""
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from src.repositories import LLMConfigRepository, MCPServerRepository
from src.core.database import get_db_context, DB_AVAILABLE
from src.core.models import LLMConfig, MCPServer
from src.utils.encryption import decrypt_value
import os


class ConfigService:
    """
    Service for managing configuration
    Following Service Layer Pattern
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        if db:
            self._llm_repo = LLMConfigRepository(db)
            self._mcp_repo = MCPServerRepository(db)
        else:
            self._llm_repo = None
            self._mcp_repo = None

    def load_llm_config(self, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Load LLM configuration using Repository Pattern
        """
        if not DB_AVAILABLE or not self._llm_repo:
            return self._load_from_environment()

        config = self._llm_repo.find_active_by_user(user_id)
        if not config:
            return self._load_from_environment()

        config_dict = config.to_dict(include_api_key=True)
        self._ensure_api_key_from_env(config_dict)

        return config_dict

    def load_mcp_servers(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Load MCP servers using Repository Pattern
        """
        if not DB_AVAILABLE or not self._mcp_repo or not user_id:
            return []

        servers = self._mcp_repo.find_enabled_by_user(user_id)
        return [server.to_dict(include_api_key=True) for server in servers]

    def save_llm_config(self, config: Dict[str, Any], user_id: Optional[int] = None) -> bool:
        """
        Save LLM configuration using Repository Pattern
        """
        if not DB_AVAILABLE or not self._llm_repo:
            return False

        # Deactivate all existing configs
        self._llm_repo.deactivate_all(user_id)

        # Create new active config
        from src.utils.encryption import encrypt_value

        new_config = self._llm_repo.create(
            user_id=user_id,
            type=config.get('type', 'gemini'),
            model=config.get('model', 'gemini-2.0-flash'),
            api_key=encrypt_value(config.get('api_key')) if config.get('api_key') else None,
            base_url=config.get('base_url'),
            api_base=config.get('api_base'),
            active=True,
            is_default=config.get('is_default', False)
        )

        return new_config is not None

    def _ensure_api_key_from_env(self, config_dict: Dict[str, Any]):
        """Ensure API key is loaded from environment if missing"""
        if config_dict.get('api_key'):
            return

        provider_type = config_dict.get('type', '').lower()
        env_key_map = {
            'gemini': 'GOOGLE_API_KEY',
            'openai': 'OPENAI_LLM_API_KEY',
            'deepseek': 'DEEPSEEK_KEY',
            'groq': 'GROQ_API_KEY',
            'openrouter': 'OPENROUTER_API_KEY',
        }

        env_key = env_key_map.get(provider_type)
        if env_key:
            config_dict['api_key'] = os.getenv(env_key)

    def _load_from_environment(self) -> Optional[Dict[str, Any]]:
        """Fallback to environment variables"""
        # Try to detect provider from environment
        if os.getenv("GOOGLE_API_KEY"):
            return {
                "type": "gemini",
                "model": "gemini-2.0-flash",
                "api_key": os.getenv("GOOGLE_API_KEY")
            }
        elif os.getenv("OPENAI_LLM_API_KEY"):
            return {
                "type": "openai",
                "model": "gpt-4o",
                "api_key": os.getenv("OPENAI_LLM_API_KEY")
            }
        return None

