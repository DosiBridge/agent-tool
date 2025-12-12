"""
MCP Server Repository - Repository Pattern
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from src.repositories.base_repository import BaseRepository
from src.core.models import MCPServer


class MCPServerRepository(BaseRepository[MCPServer]):
    """Repository for MCP Server operations"""

    def __init__(self, db: Session):
        super().__init__(db, MCPServer)

    def find_enabled_by_user(self, user_id: int) -> List[MCPServer]:
        """Find enabled MCP servers for a user (user-specific + global)"""
        return self.db.query(MCPServer).filter(
            and_(
                MCPServer.enabled == True,
                or_(
                    MCPServer.user_id == user_id,
                    MCPServer.user_id.is_(None),
                    MCPServer.user_id == 1
                )
            )
        ).all()

    def find_by_name_and_user(self, name: str, user_id: Optional[int]) -> Optional[MCPServer]:
        """Find MCP server by name and user"""
        query = self.db.query(MCPServer).filter(MCPServer.name == name)
        if user_id:
            query = query.filter(MCPServer.user_id == user_id)
        return query.first()

    def find_global_servers(self) -> List[MCPServer]:
        """Find all global MCP servers"""
        return self.db.query(MCPServer).filter(
            or_(MCPServer.user_id.is_(None), MCPServer.user_id == 1)
        ).all()

    def find_user_servers(self, user_id: int) -> List[MCPServer]:
        """Find all user-specific MCP servers"""
        return self.db.query(MCPServer).filter(MCPServer.user_id == user_id).all()

