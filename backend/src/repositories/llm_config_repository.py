"""
LLM Config Repository - Repository Pattern

Handles all LLM config database operations. The logic for finding
user-specific vs global configs was getting messy, so moved it here.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from src.repositories.base_repository import BaseRepository
from src.core.models import LLMConfig


class LLMConfigRepository(BaseRepository[LLMConfig]):
    """
    Repository for LLM Config operations

    Handles the priority logic: user-specific > global default
    Could probably simplify this but it works.
    """

    def __init__(self, db: Session):
        super().__init__(db, LLMConfig)

    def find_active_by_user(self, user_id: Optional[int]) -> Optional[LLMConfig]:
        """
        Find active LLM config for a user

        Priority:
        1. User-specific active config
        2. Global default config from environment (user_id=None)
        3. Legacy global default config (user_id=1) for backward compatibility

        The user_id==1 check is for backward compatibility with old data.
        New configs should use user_id=None (initialized from environment variables).
        """
        query = self.db.query(LLMConfig).filter(LLMConfig.active == True)

        if user_id:
            # First try user-specific config
            user_config = query.filter(LLMConfig.user_id == user_id).first()
            if user_config:
                return user_config

            # Fall back to global config - prioritize environment-based (user_id=None) over legacy (user_id=1)
            # First try: environment-based global configs (user_id=None)
            env_config = query.filter(
                LLMConfig.user_id.is_(None),
                LLMConfig.is_default == True
            ).order_by(LLMConfig.created_at.desc()).first()
            if env_config:
                return env_config

            # Fallback: legacy global configs (user_id=1) for backward compatibility
            return query.filter(
                LLMConfig.user_id == 1,
                LLMConfig.is_default == True
            ).order_by(LLMConfig.created_at.desc()).first()
        else:
            # No user - global config only
            # Prioritize environment-based (user_id=None) over legacy (user_id=1)
            # First try: environment-based global configs (user_id=None)
            env_config = query.filter(
                LLMConfig.user_id.is_(None),
                LLMConfig.is_default == True
            ).order_by(LLMConfig.created_at.desc()).first()
            if env_config:
                return env_config

            # Fallback: legacy global configs (user_id=1) for backward compatibility
            return query.filter(
                LLMConfig.user_id == 1,
                LLMConfig.is_default == True
            ).order_by(LLMConfig.created_at.desc()).first()

    def find_all_by_user(self, user_id: int) -> List[LLMConfig]:
        """Find all LLM configs for a user"""
        return self.db.query(LLMConfig).filter(
            or_(LLMConfig.user_id == user_id, LLMConfig.user_id.is_(None))
        ).all()

    def find_global_configs(self) -> List[LLMConfig]:
        """Find all global LLM configs"""
        return self.db.query(LLMConfig).filter(
            or_(LLMConfig.user_id.is_(None), LLMConfig.user_id == 1)
        ).all()

    def deactivate_all(self, user_id: Optional[int] = None) -> int:
        """Deactivate all configs (optionally for a specific user)"""
        query = self.db.query(LLMConfig)
        if user_id is not None:
            query = query.filter(LLMConfig.user_id == user_id)

        count = query.update({LLMConfig.active: False})
        self.db.flush()
        return count

