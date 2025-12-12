"""
Chat Response Builder - Builder Pattern

Makes it easier to build responses, especially when some fields are optional.
Fluent interface is nice for readability.
"""
from typing import Optional, List
from src.services.chat_models import ChatResponseData, TokenUsage


class ChatResponseBuilder:
    """
    Builder for constructing ChatResponseData objects
    Following Builder Pattern

    Use this when building responses - much cleaner than passing dicts around.
    """

    def __init__(self):
        self._response: Optional[str] = None
        self._session_id: Optional[str] = None
        self._mode: Optional[str] = None
        self._tools_used: List[str] = []
        self._token_usage: Optional[TokenUsage] = None

    def with_response(self, response: str) -> "ChatResponseBuilder":
        """Set the response text"""
        self._response = response
        return self

    def with_session_id(self, session_id: str) -> "ChatResponseBuilder":
        """Set the session ID"""
        self._session_id = session_id
        return self

    def with_mode(self, mode: str) -> "ChatResponseBuilder":
        """Set the chat mode"""
        self._mode = mode
        return self

    def with_tools_used(self, tools_used: List[str]) -> "ChatResponseBuilder":
        """Set the tools used"""
        self._tools_used = tools_used
        return self

    def add_tool(self, tool: str) -> "ChatResponseBuilder":
        """Add a tool to the tools used list"""
        if tool not in self._tools_used:
            self._tools_used.append(tool)
        return self

    def with_token_usage(
        self,
        input_tokens: int = 0,
        output_tokens: int = 0,
        embedding_tokens: int = 0
    ) -> "ChatResponseBuilder":
        """Set token usage"""
        self._token_usage = TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            embedding_tokens=embedding_tokens
        )
        return self

    def with_token_usage_object(self, token_usage: TokenUsage) -> "ChatResponseBuilder":
        """Set token usage object"""
        self._token_usage = token_usage
        return self

    def build(self) -> ChatResponseData:
        """Build the ChatResponseData object"""
        # Validate required fields
        if self._response is None:
            raise ValueError("Response is required")
        if self._session_id is None:
            raise ValueError("Session ID is required")
        if self._mode is None:
            raise ValueError("Mode is required")

        # Default token usage if not set
        if self._token_usage is None:
            self._token_usage = TokenUsage()  # All zeros by default

        return ChatResponseData(
            response=self._response,
            session_id=self._session_id,
            mode=self._mode,
            tools_used=self._tools_used,
            token_usage=self._token_usage
        )

    def build_error_response(self, error_message: str) -> ChatResponseData:
        """Build an error response"""
        return ChatResponseData(
            response=error_message,
            session_id=self._session_id or "",
            mode=self._mode or "",
            tools_used=[],
            token_usage=TokenUsage()
        )

