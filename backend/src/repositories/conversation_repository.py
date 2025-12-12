"""
Conversation Repository - Repository Pattern
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.repositories.base_repository import BaseRepository
from src.core.models import Conversation


class ConversationRepository(BaseRepository[Conversation]):
    """Repository for Conversation operations"""

    def __init__(self, db: Session):
        super().__init__(db, Conversation)

    def find_by_session_id(self, session_id: str, user_id: int) -> Optional[Conversation]:
        """Find conversation by session ID and user"""
        return self.db.query(Conversation).filter(
            Conversation.session_id == session_id,
            Conversation.user_id == user_id
        ).first()

    def find_all_by_user(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Conversation]:
        """Find all conversations for a user"""
        return self.db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(desc(Conversation.updated_at)).offset(skip).limit(limit).all()

    def find_or_create(self, session_id: str, user_id: int) -> Conversation:
        """Find or create a conversation"""
        conversation = self.find_by_session_id(session_id, user_id)
        if not conversation:
            conversation = self.create(
                session_id=session_id,
                user_id=user_id
            )
        return conversation

    def update_summary(self, session_id: str, user_id: int, summary: str) -> Optional[Conversation]:
        """Update conversation summary"""
        conversation = self.find_by_session_id(session_id, user_id)
        if conversation:
            conversation.summary = summary
            self.db.flush()
        return conversation

