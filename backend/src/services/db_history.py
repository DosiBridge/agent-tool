"""
Database-backed conversation history management
Replaces in-memory history with persistent database storage
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

from src.core import get_db_context, DB_AVAILABLE, Conversation, Message, User


class DatabaseChatMessageHistory(BaseChatMessageHistory):
    """Database-backed chat message history"""
    
    def __init__(self, session_id: str, user_id: int, db: Session):
        self.session_id = session_id
        self.user_id = user_id
        self.db = db
        self._conversation: Optional[Conversation] = None
    
    @property
    def conversation(self) -> Conversation:
        """Get or create conversation"""
        if self._conversation is None:
            self._conversation = self.db.query(Conversation).filter(
                and_(
                    Conversation.user_id == self.user_id,
                    Conversation.session_id == self.session_id
                )
            ).first()
            
            if not self._conversation:
                # Create new conversation
                self._conversation = Conversation(
                    user_id=self.user_id,
                    session_id=self.session_id,
                    title=None  # Will be set from first message
                )
                self.db.add(self._conversation)
                self.db.commit()
                self.db.refresh(self._conversation)
        
        return self._conversation
    
    @property
    def messages(self) -> List[BaseMessage]:
        """Get all messages from database"""
        conv = self.conversation
        db_messages = self.db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.created_at).all()
        
        # Convert to LangChain messages
        langchain_messages = []
        for msg in db_messages:
            if msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
            elif msg.role == "system":
                langchain_messages.append(SystemMessage(content=msg.content))
        
        return langchain_messages
    
    def add_message(self, message: BaseMessage) -> None:
        """Add a message to the conversation"""
        import json
        
        conv = self.conversation
        
        # Determine role
        if isinstance(message, HumanMessage):
            role = "user"
        elif isinstance(message, AIMessage):
            role = "assistant"
        elif isinstance(message, SystemMessage):
            role = "system"
        else:
            role = "assistant"  # Default
        
        # Extract tool calls if present
        tool_calls_json = None
        if hasattr(message, "tool_calls") and message.tool_calls:
            try:
                tool_calls_json = json.dumps(message.tool_calls)
            except Exception:
                pass
        
        # Create message
        db_message = Message(
            conversation_id=conv.id,
            role=role,
            content=message.content,
            tool_calls=tool_calls_json
        )
        self.db.add(db_message)
        
        # Update conversation title from first user message if not set
        if not conv.title and role == "user":
            # Use first 100 chars of first message as title
            title = message.content[:100].strip()
            if len(message.content) > 100:
                title += "..."
            conv.title = title
        
        # Update conversation updated_at
        from sqlalchemy.sql import func
        conv.updated_at = func.now()
        
        self.db.commit()
        self.db.refresh(db_message)
    
    def add_user_message(self, content: str) -> None:
        """Add a user message (convenience method)"""
        self.add_message(HumanMessage(content=content))
    
    def add_ai_message(self, content: str) -> None:
        """Add an AI message (convenience method)"""
        self.add_message(AIMessage(content=content))
    
    def clear(self) -> None:
        """Clear all messages from the conversation"""
        conv = self.conversation
        self.db.query(Message).filter(Message.conversation_id == conv.id).delete()
        self.db.commit()


class DatabaseConversationHistoryManager:
    """Manages conversation history using database"""
    
    def __init__(self):
        """Initialize the history manager"""
        if DB_AVAILABLE:
            print("✓ Database Conversation History Manager initialized")
        else:
            print("⚠️  Database not available, conversation history will not persist")
    
    def get_session_history(self, session_id: str, user_id: Optional[int] = None, db: Optional[Session] = None) -> BaseChatMessageHistory:
        """
        Get or create a chat history for a specific session
        
        Args:
            session_id: Unique identifier for the conversation session
            user_id: User ID (required for database storage)
            db: Optional database session (if None, creates a new one)
            
        Returns:
            BaseChatMessageHistory for the session
        """
        if not DB_AVAILABLE:
            # Fallback to in-memory if DB not available
            from .history import history_manager
            return history_manager.get_session_history(session_id, user_id)
        
        if user_id is None:
            raise ValueError("user_id is required for database-backed history")
        
        # Use provided session or create new one
        if db:
            return DatabaseChatMessageHistory(session_id, user_id, db)
        else:
            # Create a context manager that provides the session
            from contextlib import contextmanager
            
            @contextmanager
            def get_db_session():
                with get_db_context() as session:
                    yield session
            
            # For now, create a new session (caller should manage it)
            # This is a limitation - ideally we'd use a session manager
            with get_db_context() as session:
                return DatabaseChatMessageHistory(session_id, user_id, session)
    
    def get_session_messages(self, session_id: str, user_id: Optional[int] = None, db: Optional[Session] = None) -> List[BaseMessage]:
        """Get all messages from a session"""
        if not DB_AVAILABLE or user_id is None:
            from .history import history_manager
            return history_manager.get_session_messages(session_id, user_id)
        
        if db:
            history = DatabaseChatMessageHistory(session_id, user_id, db)
        else:
            with get_db_context() as session:
                history = DatabaseChatMessageHistory(session_id, user_id, session)
        
        return history.messages
    
    def clear_session(self, session_id: str, user_id: Optional[int] = None, db: Optional[Session] = None) -> None:
        """Clear history for a specific session"""
        if not DB_AVAILABLE or user_id is None:
            from .history import history_manager
            return history_manager.clear_session(session_id, user_id)
        
        if db:
            history = DatabaseChatMessageHistory(session_id, user_id, db)
        else:
            with get_db_context() as session:
                history = DatabaseChatMessageHistory(session_id, user_id, session)
        
        history.clear()
    
    def list_sessions(self, user_id: Optional[int] = None, db: Optional[Session] = None) -> List[dict]:
        """List all conversations for a user"""
        if not DB_AVAILABLE or user_id is None:
            from .history import history_manager
            session_ids = history_manager.list_sessions(user_id)
            return [{"session_id": sid} for sid in session_ids]
        
        if db:
            conversations = db.query(Conversation).filter(
                Conversation.user_id == user_id
            ).order_by(Conversation.updated_at.desc()).all()
        else:
            with get_db_context() as session:
                conversations = session.query(Conversation).filter(
                    Conversation.user_id == user_id
                ).order_by(Conversation.updated_at.desc()).all()
        
        return [conv.to_dict() for conv in conversations]


# Global database history manager instance
db_history_manager = DatabaseConversationHistoryManager()

