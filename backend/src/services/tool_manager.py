"""
Tool management service
Following Refactoring.Guru: Extract Class, Move Method
"""
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session
    from langchain_core.tools import BaseTool

from src.services.tools import (
    retrieve_dosiblog_context,
    load_custom_rag_tools,
    create_appointment_tool
)
from src.services.mcp_client import MCPClientManager
from src.core import Config
from src.services.chat_conditionals import ConditionalHelpers


class ToolManager:
    """Manages tool loading and organization"""

    def __init__(self, user_id: Optional[int] = None, db: Optional["Session"] = None):
        self.user_id = user_id
        self.db = db
        self._mcp_tools: List = []
        self._custom_rag_tools: List = []
        self._appointment_tool = None
        self._all_tools: List = []

    async def load_all_tools(self, mcp_servers: Optional[List] = None) -> List:
        """
        Load all available tools
        Following Refactoring.Guru: Extract Method, Move Method
        """
        if mcp_servers is None:
            mcp_servers = Config.load_mcp_servers(user_id=self.user_id, db=self.db)

        async with MCPClientManager(mcp_servers) as mcp_tools:
            self._mcp_tools = mcp_tools
            self._load_custom_tools()
            self._combine_tools()
            return self._all_tools

    def _load_custom_tools(self):
        """Load custom RAG tools and appointment tool"""
        if ConditionalHelpers.should_load_custom_rag_tools(self.user_id, self.db):
            self._custom_rag_tools = load_custom_rag_tools(self.user_id, self.db)
        else:
            self._custom_rag_tools = []

        self._appointment_tool = create_appointment_tool(user_id=self.user_id, db=self.db)

    def _combine_tools(self):
        """Combine all tools into a single list"""
        self._all_tools = [
            retrieve_dosiblog_context,
            self._appointment_tool
        ] + self._custom_rag_tools + self._mcp_tools

    def get_tool_summary(self) -> dict:
        """Get summary of loaded tools"""
        return {
            "total": len(self._all_tools),
            "local_rag": 1,  # retrieve_dosiblog_context
            "custom_rag": len(self._custom_rag_tools),
            "mcp": len(self._mcp_tools),
            "appointment": 1 if self._appointment_tool else 0
        }

    def get_all_tools(self) -> List:
        """Get all loaded tools"""
        return self._all_tools.copy()

