"""
Parameter objects for chat service
Following Refactoring.Guru: Introduce Parameter Object
"""
from dataclasses import dataclass
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


@dataclass
class ChatRequestParams:
    """Parameter object for chat processing requests"""
    message: str
    session_id: str
    user_id: Optional[int] = None
    db: Optional["Session"] = None
    collection_id: Optional[int] = None
    use_react: bool = False
    agent_prompt: Optional[str] = None


@dataclass
class ChatResponseData:
    """Response data structure for chat processing"""
    response: str
    session_id: str
    mode: str
    tools_used: list
    token_usage: dict

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "response": self.response,
            "session_id": self.session_id,
            "mode": self.mode,
            "tools_used": self.tools_used,
            "token_usage": self.token_usage
        }


@dataclass
class TokenUsage:
    """Token usage information"""
    input_tokens: int = 0
    output_tokens: int = 0
    embedding_tokens: int = 0

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "embedding_tokens": self.embedding_tokens
        }


@dataclass
class LLMConfig:
    """LLM configuration parameters"""
    type: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    api_base: Optional[str] = None
    is_default: bool = False

    def is_ollama(self) -> bool:
        """Check if LLM is Ollama"""
        return self.type.lower() == "ollama"

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "type": self.type,
            "model": self.model,
            "api_key": self.api_key,
            "base_url": self.base_url,
            "api_base": self.api_base,
            "is_default": self.is_default
        }

