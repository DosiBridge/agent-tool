"""
Database models for LLM config and MCP servers
"""
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.sql import func

# Import Base from database (may be None if database is not available)
try:
    from .database import Base
    if Base is None:
        raise ImportError("Base is None - database not available")
except (ImportError, AttributeError):
    # Database not available - models won't be used
    Base = None  # type: ignore

# Only define models if Base is available
if Base is not None:
    class LLMConfig(Base):
        """LLM Configuration model"""
        __tablename__ = "llm_config"
        
        id = Column(Integer, primary_key=True, index=True)
        type = Column(String(50), nullable=False, default="openai")  # openai, gemini, ollama, groq
        model = Column(String(200), nullable=False)
        api_key = Column(Text, nullable=True)  # Encrypted or stored securely
        base_url = Column(String(500), nullable=True)  # For custom API endpoints
        api_base = Column(String(500), nullable=True)  # Alternative base URL field
        active = Column(Boolean, default=True, nullable=False)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), onupdate=func.now())
        
        def to_dict(self, include_api_key: bool = False) -> dict:
            """Convert model to dictionary"""
            result = {
                "type": self.type,
                "model": self.model,
                "base_url": self.base_url,
                "api_base": self.api_base,
                "active": self.active,
                "has_api_key": bool(self.api_key)
            }
            if include_api_key:
                result["api_key"] = self.api_key
            return result

    class MCPServer(Base):
        """MCP Server configuration model"""
        __tablename__ = "mcp_servers"
        
        id = Column(Integer, primary_key=True, index=True)
        name = Column(String(100), unique=True, nullable=False, index=True)
        url = Column(String(500), nullable=False)
        api_key = Column(Text, nullable=True)  # Optional API key for the MCP server
        enabled = Column(Boolean, default=True, nullable=False)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), onupdate=func.now())
        
        def to_dict(self, include_api_key: bool = False) -> dict:
            """Convert model to dictionary"""
            result = {
                "name": self.name,
                "url": self.url,
                "enabled": self.enabled,
                "has_api_key": bool(self.api_key)
            }
            if include_api_key:
                result["api_key"] = self.api_key
            return result
else:
    # Dummy classes when database is not available
    LLMConfig = None  # type: ignore
    MCPServer = None  # type: ignore
