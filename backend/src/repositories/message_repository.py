"""
Message Repository - Repository Pattern
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from src.repositories.base_repository import BaseRepository
from src.core.models import Message, Conversation


class MessageRepository(BaseRepository[Message]):
    """Repository for Message operations"""

    def __init__(self, db: Session):
        super().__init__(db, Message)

    def find_by_conversation(
        self,
        conversation_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Message]:
        """Find messages by conversation ID"""
        return self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).offset(skip).limit(limit).all()

    def find_by_session_id(
        self,
        session_id: str,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Message]:
        """Find messages by session ID"""
        conversation = self.db.query(Conversation).filter(
            Conversation.session_id == session_id,
            Conversation.user_id == user_id
        ).first()

        if not conversation:
            return []

        return self.find_by_conversation(conversation.id, skip, limit)

    def count_by_conversation(self, conversation_id: int) -> int:
        """Count messages in a conversation"""
        return self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).count()

    def delete_by_conversation(self, conversation_id: int) -> int:
        """Delete all messages in a conversation"""
        count = self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).delete()
        self.db.flush()
        return count

