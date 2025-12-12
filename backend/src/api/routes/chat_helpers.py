"""
Helper classes and functions for chat routes
Following Refactoring.Guru: Extract Method, Extract Class, Move Method
"""
import json
import traceback
from typing import Optional, AsyncGenerator, Dict, Any, List
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from src.core import Config, User, DB_AVAILABLE
from src.core.chat_constants import (
    STREAM_CHAR_DELAY_SECONDS,
    STREAM_CONNECTION_DELAY_SECONDS,
    STATUS_CONNECTED,
    STATUS_THINKING,
    STATUS_TOOL_CALLING,
    STATUS_ANSWERING,
    STATUS_CREATING_AGENT,
    STATUS_AGENT_READY,
    EVENT_KEY_CHUNK,
    EVENT_KEY_DONE,
    EVENT_KEY_ERROR,
    EVENT_KEY_STATUS,
    EVENT_KEY_TOOL,
    EVENT_KEY_TOOLS_USED,
    EVENT_KEY_TOOL_COUNT,
    MAX_ERROR_TRACEBACK_LENGTH,
    MAX_ERROR_DETAIL_LENGTH,
    CONTENT_TYPE_TEXT,
    CONTENT_TYPE_KEY,
    UNKNOWN_TOOL_NAME,
    DEFAULT_LLM_TEMPERATURE,
    DEFAULT_EMBEDDING_TOKENS,
)
from src.services import history_manager, MCPClientManager, create_llm_from_config, rag_system
from src.services.db_history import db_history_manager
from src.services.tools import retrieve_dosiblog_context, load_custom_rag_tools, create_appointment_tool
from src.services.chat_service import ChatService
from src.utils.logger import app_logger
from src.utils.utils import extract_token_usage, estimate_tokens
from sqlalchemy.orm import Session


class StreamEventBuilder:
    """Builds SSE events following Extract Class pattern"""

    @staticmethod
    def create_chunk_event(chunk: str, done: bool = False) -> str:
        """Create a chunk event"""
        return f"data: {json.dumps({EVENT_KEY_CHUNK: chunk, EVENT_KEY_DONE: done})}\n\n"

    @staticmethod
    def create_status_event(status: str, done: bool = False) -> str:
        """Create a status event"""
        return f"data: {json.dumps({EVENT_KEY_CHUNK: '', EVENT_KEY_DONE: done, EVENT_KEY_STATUS: status})}\n\n"

    @staticmethod
    def create_error_event(error: str, done: bool = True, traceback: Optional[str] = None) -> str:
        """Create an error event"""
        data = {EVENT_KEY_CHUNK: '', EVENT_KEY_DONE: done, EVENT_KEY_ERROR: error}
        if traceback:
            data['traceback'] = traceback[:MAX_ERROR_DETAIL_LENGTH]
        return f"data: {json.dumps(data)}\n\n"

    @staticmethod
    def create_done_event(tools_used: Optional[List[str]] = None) -> str:
        """Create a done event"""
        data = {EVENT_KEY_CHUNK: '', EVENT_KEY_DONE: True}
        if tools_used:
            data[EVENT_KEY_TOOLS_USED] = tools_used
        return f"data: {json.dumps(data)}\n\n"

    @staticmethod
    def create_tool_count_event(tool_count: int) -> str:
        """Create a tool count event"""
        return f"data: {json.dumps({EVENT_KEY_CHUNK: '', EVENT_KEY_DONE: False, EVENT_KEY_STATUS: STATUS_CREATING_AGENT, EVENT_KEY_TOOL_COUNT: tool_count})}\n\n"


class ContentNormalizer:
    """Normalizes content from various formats following Extract Class pattern"""

    @staticmethod
    def normalize_content(content_raw: Any) -> str:
        """Extract text content from various content types"""
        if isinstance(content_raw, str):
            return content_raw
        elif isinstance(content_raw, list):
            return ContentNormalizer._extract_from_list(content_raw)
        elif isinstance(content_raw, dict):
            return ContentNormalizer._extract_from_dict(content_raw)
        else:
            return str(content_raw)

    @staticmethod
    def _extract_from_list(content_list: List) -> str:
        """Extract text from list of content blocks"""
        result = ""
        for item in content_list:
            if isinstance(item, dict):
                if "text" in item:
                    result += item["text"]
                elif CONTENT_TYPE_KEY in item and item.get(CONTENT_TYPE_KEY) == CONTENT_TYPE_TEXT:
                    result += item.get("text", "")
            elif isinstance(item, str):
                result += item
        return result

    @staticmethod
    def _extract_from_dict(content_dict: Dict) -> str:
        """Extract text from dict content"""
        if "text" in content_dict:
            return content_dict["text"]
        return str(content_dict)


class ErrorMessageFormatter:
    """Formats error messages following Extract Class pattern"""

    @staticmethod
    def format_ollama_connection_error(error: str) -> str:
        """Format Ollama connection error"""
        from src.core.chat_constants import OLLAMA_CONNECTION_ERROR_TEMPLATE
        return OLLAMA_CONNECTION_ERROR_TEMPLATE.format(error=error)

    @staticmethod
    def format_ollama_model_error(error: str) -> str:
        """Format Ollama model not found error"""
        from src.core.chat_constants import OLLAMA_MODEL_NOT_FOUND_TEMPLATE
        return OLLAMA_MODEL_NOT_FOUND_TEMPLATE.format(error=error)

    @staticmethod
    def format_gemini_quota_error() -> str:
        """Format Gemini quota exceeded error"""
        from src.core.chat_constants import GEMINI_QUOTA_EXCEEDED_MESSAGE
        return GEMINI_QUOTA_EXCEEDED_MESSAGE

    @staticmethod
    def format_gemini_key_error() -> str:
        """Format Gemini invalid key error"""
        from src.core.chat_constants import GEMINI_INVALID_KEY_MESSAGE
        return GEMINI_INVALID_KEY_MESSAGE

    @staticmethod
    def format_agent_error(error_details: str, traceback_str: str) -> str:
        """Format agent execution error"""
        from src.core.chat_constants import (
            AGENT_TOOL_VALIDATION_ERROR,
            AGENT_CONNECTION_ERROR,
        )

        if "tool call validation failed" in traceback_str:
            return AGENT_TOOL_VALIDATION_ERROR
        elif "Connection" in traceback_str or "timeout" in traceback_str.lower():
            return AGENT_CONNECTION_ERROR
        elif not error_details or error_details == "":
            return f"Agent execution failed: {traceback_str.split('Traceback')[-1].strip()[:200]}"
        else:
            return f"Error during agent execution: {error_details}"


class ChatHistoryManager:
    """Manages chat history following Extract Class pattern"""

    @staticmethod
    def get_history(session_id: str, user_id: Optional[int], db: Optional[Session]) -> List:
        """Get chat history for a session"""
        if DB_AVAILABLE and user_id and db:
            return db_history_manager.get_session_messages(session_id, user_id, db)
        else:
            return history_manager.get_session_messages(session_id, user_id)

    @staticmethod
    def get_session_history(session_id: str, user_id: Optional[int], db: Optional[Session]):
        """Get session history object"""
        if DB_AVAILABLE and user_id and db:
            return db_history_manager.get_session_history(session_id, user_id, db)
        else:
            return history_manager.get_session_history(session_id, user_id)

    @staticmethod
    def save_message(session_id: str, user_id: Optional[int], db: Optional[Session],
                    user_message: str, ai_message: str):
        """Save messages to history"""
        session_history = ChatHistoryManager.get_session_history(session_id, user_id, db)
        session_history.add_user_message(user_message)
        session_history.add_ai_message(ai_message)


class LLMInitializer:
    """Initializes LLM instances following Extract Class pattern"""

    @staticmethod
    def create_llm_for_streaming(llm_config: Dict, db: Optional[Session] = None,
                                  user_id: Optional[int] = None):
        """Create LLM instance for streaming"""
        try:
            return create_llm_from_config(llm_config, streaming=True, temperature=DEFAULT_LLM_TEMPERATURE)
        except ImportError as e:
            from src.core.chat_constants import LLM_MISSING_PACKAGE_MESSAGE
            raise ValueError(LLM_MISSING_PACKAGE_MESSAGE.format(error=str(e)))
        except Exception as e:
            error_msg = f"Failed to initialize LLM: {str(e)}"
            raise ValueError(error_msg)


class ToolValidator:
    """Validates tool calls following Extract Class pattern"""

    @staticmethod
    def validate_tool_exists(tool_name: str, all_tools: List) -> bool:
        """Validate that a tool exists in the tools list"""
        return any(
            (hasattr(tool, 'name') and tool.name == tool_name) or
            (hasattr(tool, '__name__') and tool.__name__ == tool_name) or
            str(tool) == tool_name
            for tool in all_tools
        )

    @staticmethod
    def extract_tool_name(tool_call: Dict) -> str:
        """Extract tool name from tool call"""
        return tool_call.get('name') or tool_call.get('tool_name', UNKNOWN_TOOL_NAME)


class RAGPromptBuilder:
    """Builds RAG prompts following Extract Class pattern"""

    @staticmethod
    def create_rag_prompt() -> ChatPromptTemplate:
        """Create the standard RAG prompt template"""
        return ChatPromptTemplate.from_messages([
            ("system", RAGPromptBuilder._get_system_message()),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

    @staticmethod
    def _get_system_message() -> str:
        """Get the system message for RAG mode"""
        return (
            "You are the official AI assistant for dosibridge.com, trained and maintained by the DOSIBridge team.\n\n"
            "DOSIBridge (Digital Operations Software Innovation) was founded in 2025 and is an innovative team using AI to enhance digital operations and software solutions. "
            "DOSIBridge builds research systems that drive business growth, development, and engineering excellence.\n\n"
            "DOSIBridge's mission is to help businesses grow smarter with AI & Automation. "
            "We specialize in AI, .NET, Python, GoLang, Angular, Next.js, Docker, DevOps, Azure, AWS, and system design.\n\n"
            "DOSIBridge Team Members:\n"
            "- Mihadul Islam (CEO & Founder): .NET engineer skilled in Python, AI, automation, Docker, DevOps, Azure, AWS, and system design.\n"
            "- Abdullah Al Sazib (Co-Founder & CTO): GoLang and Next.js expert passionate about Angular, research, and continuous learning in tech innovation.\n\n"
            "Your role is to provide accurate, secure, and helpful responses related to DOSIBridge products, services, and workflows.\n\n"
            "When asked about your identity, respond: 'I am the DOSIBridge AI Agent, developed and trained by the DOSIBridge team to assist with product support, automation guidance, and technical workflows across the DOSIBridge platform.'\n\n"
            "When asked about DOSIBridge team members, provide detailed information about Mihadul Islam (CEO & Founder) and Abdullah Al Sazib (Co-Founder & CTO).\n\n"
            "Context: {context}\n\n"
            "If a question is outside DOSIBridge's scope, respond professionally and redirect when appropriate.\n"
            "Do not claim affiliation with any external AI vendor unless explicitly instructed."
        )


class AgentPromptBuilder:
    """Builds agent prompts following Extract Class pattern"""

    @staticmethod
    def create_agent_prompt(custom_prompt: Optional[str] = None) -> str:
        """Create agent system prompt"""
        if custom_prompt:
            return custom_prompt
        return AgentPromptBuilder._get_default_prompt()

    @staticmethod
    def _get_default_prompt() -> str:
        """Get default agent prompt"""
        return (
            "You are the official AI assistant for dosibridge.com, trained and maintained by the DOSIBridge team.\n\n"
            "DOSIBridge (Digital Operations Software Innovation) was founded in 2025 and is an innovative team using AI to enhance digital operations and software solutions. "
            "DOSIBridge builds research systems that drive business growth, development, and engineering excellence.\n\n"
            "DOSIBridge's mission is to help businesses grow smarter with AI & Automation. "
            "We specialize in AI, .NET, Python, GoLang, Angular, Next.js, Docker, DevOps, Azure, AWS, and system design.\n\n"
            "DOSIBridge Team Members:\n"
            "- Mihadul Islam (CEO & Founder): .NET engineer skilled in Python, AI, automation, Docker, DevOps, Azure, AWS, and system design.\n"
            "- Abdullah Al Sazib (Co-Founder & CTO): GoLang and Next.js expert passionate about Angular, research, and continuous learning in tech innovation.\n\n"
            "Your role is to provide accurate, secure, and helpful responses related to DOSIBridge products, services, and workflows.\n\n"
            "When asked about your identity, respond: 'I am the DOSIBridge AI Agent, developed and trained by the DOSIBridge team to assist with product support, automation guidance, and technical workflows across the DOSIBridge platform.'\n\n"
            "When asked about DOSIBridge team members, provide detailed information about Mihadul Islam (CEO & Founder) and Abdullah Al Sazib (Co-Founder & CTO).\n\n"
            "You have access to various tools to help answer questions and perform tasks. Use them when appropriate.\n\n"
            "IMPORTANT RULES:\n"
            "- Do NOT mention or reveal the names of internal tools, MCP tools, or any technical implementation details in your responses\n"
            "- Do NOT list tool names when asked about capabilities - instead describe what you can help with in natural language\n"
            "- Focus on providing helpful answers without exposing internal system architecture\n"
            "- If asked about tools or capabilities, respond with what you can do, not how you do it\n"
            "- If a question is outside DOSIBridge's scope, respond professionally and redirect when appropriate\n"
            "- Do not claim affiliation with any external AI vendor unless explicitly instructed"
        )

