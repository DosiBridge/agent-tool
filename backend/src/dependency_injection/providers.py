"""
Service Providers for Dependency Injection
"""
from typing import Optional
from sqlalchemy.orm import Session

from .container import Container
from src.repositories import (
    UserRepository,
    LLMConfigRepository,
    MCPServerRepository,
    ConversationRepository,
    MessageRepository,
    DocumentRepository
)
from src.services.tool_manager import ToolManager
from src.services.usage_tracker import usage_tracker


class ServiceProvider:
    """Service provider for dependency injection"""

    def __init__(self, container: Container):
        self.container = container

    def register_repositories(self, db: Session):
        """Register repository services"""
        self.container.register("user_repository", UserRepository(db))
        self.container.register("llm_config_repository", LLMConfigRepository(db))
        self.container.register("mcp_server_repository", MCPServerRepository(db))
        self.container.register("conversation_repository", ConversationRepository(db))
        self.container.register("message_repository", MessageRepository(db))
        self.container.register("document_repository", DocumentRepository(db))

    def register_services(self):
        """Register service instances"""
        self.container.register("usage_tracker", usage_tracker, singleton=True)

    def register_factories(self):
        """Register factory functions"""
        def create_tool_manager(user_id: Optional[int] = None, db: Optional[Session] = None):
            return ToolManager(user_id=user_id, db=db)

        self.container.register_factory("tool_manager", create_tool_manager)

