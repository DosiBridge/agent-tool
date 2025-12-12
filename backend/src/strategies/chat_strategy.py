"""
Chat Strategy Pattern
Different strategies for processing chat messages

Refactored from chat_service to make it easier to add new modes.
RAG and Agent modes are quite different, so separate strategies make sense.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dataclasses import dataclass

from src.services.chat_models import ChatRequestParams, ChatResponseData, TokenUsage


@dataclass
class ChatContext:
    """Context for chat processing - keeps things organized"""
    user_id: Optional[int]
    db: Optional[Any]
    llm_config: Dict[str, Any]
    session_id: str
    message: str


class ChatStrategy(ABC):
    """
    Abstract base class for chat processing strategies
    Following Strategy Pattern

    Each mode (RAG, Agent) has its own strategy implementation.
    Makes it easy to add new modes without touching existing code.
    """

    @abstractmethod
    async def process(self, params: ChatRequestParams, context: ChatContext) -> ChatResponseData:
        """Process chat request"""
        pass

    @abstractmethod
    def get_mode(self) -> str:
        """Get the mode this strategy handles"""
        pass


class RAGChatStrategy(ChatStrategy):
    """Strategy for RAG mode chat processing"""

    async def process(self, params: ChatRequestParams, context: ChatContext) -> ChatResponseData:
        """Process RAG mode chat"""
        from src.services.advanced_rag import advanced_rag_system
        from src.services import rag_system
        from src.services.chat_conditionals import ConditionalHelpers
        from src.services.chat_helpers import RAGPromptBuilder, ChatHistoryManager
        from src.services.llm_provider_factory import LLMProviderFactory
        from langchain_core.messages import HumanMessage
        from src.utils.utils import extract_token_usage, estimate_tokens
        from src.core.chat_constants import DEFAULT_LLM_TEMPERATURE

        # Retrieve context
        if ConditionalHelpers.should_use_advanced_rag(params.user_id):
            retrieved_docs = advanced_rag_system.retrieve(
                query=params.message,
                user_id=params.user_id,
                k=5,
                use_reranking=True,
                use_hybrid=True,
                collection_id=params.collection_id
            )

            context_parts = []
            for doc in retrieved_docs:
                content = doc["content"]
                metadata = doc.get("metadata", {})
                source = metadata.get("original_filename", "Document")
                context_parts.append(f"[{source}]\n{content}\n")

            context = "\n".join(context_parts) if context_parts else "No relevant documents found."
        else:
            context = rag_system.retrieve_context(params.message)

        # Create LLM
        provider = LLMProviderFactory.create_provider(context.llm_config)
        llm = provider.create_llm(streaming=False, temperature=DEFAULT_LLM_TEMPERATURE)

        # Get history
        history = ChatHistoryManager.get_history(
            params.session_id, params.user_id, params.db
        )
        session_history = ChatHistoryManager.get_session_history(
            params.session_id, params.user_id, params.db
        )

        # Build prompt and invoke
        prompt = RAGPromptBuilder.create_rag_prompt()
        response = llm.invoke(prompt.format(
            context=context,
            chat_history=history,
            input=params.message
        ))

        answer = response.content if hasattr(response, 'content') else str(response)

        # Extract token usage
        input_tokens, output_tokens, embedding_tokens = extract_token_usage(response)
        if input_tokens == 0 and output_tokens == 0:
            input_tokens = estimate_tokens(f"{params.message} {context}")
            output_tokens = estimate_tokens(answer)

        token_usage = TokenUsage(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            embedding_tokens=embedding_tokens
        )

        # Save to history
        session_history.add_user_message(HumanMessage(content=params.message))
        session_history.add_ai_message(HumanMessage(content=answer))

        return ChatResponseData(
            response=answer,
            session_id=params.session_id,
            mode="rag",
            tools_used=["advanced_rag_retrieval"],
            token_usage=token_usage
        )

    def get_mode(self) -> str:
        return "rag"


class AgentChatStrategy(ChatStrategy):
    """Strategy for Agent mode chat processing"""

    async def process(self, params: ChatRequestParams, context: ChatContext) -> ChatResponseData:
        """Process Agent mode chat"""
        from langchain.agents import create_agent
        from langchain_core.messages import HumanMessage
        from src.services.tool_manager import ToolManager
        from src.services.llm_provider_factory import LLMProviderFactory
        from src.services.chat_helpers import ChatHistoryManager, AgentPromptBuilder, ContentNormalizer
        from src.services.chat_conditionals import GuardClauseHelpers
        from src.utils import sanitize_tools_for_gemini
        from src.utils.utils import extract_token_usage, estimate_tokens
        from src.core.chat_constants import DEFAULT_LLM_TEMPERATURE
        from src.core import Config

        # Load tools
        mcp_servers = Config.load_mcp_servers(user_id=params.user_id, db=params.db)
        tool_manager = ToolManager(user_id=params.user_id, db=params.db)
        all_tools = await tool_manager.load_all_tools(mcp_servers)

        # Validate LLM config
        is_valid, error_msg = GuardClauseHelpers.validate_llm_config(context.llm_config)
        if not is_valid:
            return ChatResponseData(
                response=error_msg or "Unknown error",
                session_id=params.session_id,
                mode="agent",
                tools_used=[],
                token_usage=TokenUsage()
            )

        # Create LLM provider
        provider = LLMProviderFactory.create_provider(context.llm_config)

        try:
            llm = provider.create_llm(streaming=False, temperature=DEFAULT_LLM_TEMPERATURE)
        except Exception as e:
            error_msg = f"Failed to initialize LLM: {str(e)}"
            if "api_key" in str(e).lower():
                error_msg = "LLM API key is invalid or missing."
            return ChatResponseData(
                response=error_msg,
                session_id=params.session_id,
                mode="agent",
                tools_used=[],
                token_usage=TokenUsage()
            )

        # Handle providers that don't support tools
        if not provider.supports_tools():
            return await self._process_without_tools(params, context, llm)

        # Create agent with tools
        system_prompt = AgentPromptBuilder.create_agent_prompt(params.agent_prompt)
        sanitized_tools = sanitize_tools_for_gemini(all_tools, context.llm_config.get("type", ""))
        agent = create_agent(
            model=llm,
            tools=sanitized_tools,
            system_prompt=system_prompt
        )

        # Get history and run agent
        history = ChatHistoryManager.get_history(
            params.session_id, params.user_id, params.db
        )
        session_history = ChatHistoryManager.get_session_history(
            params.session_id, params.user_id, params.db
        )

        normalized_history = self._normalize_messages(history)
        messages = normalized_history + [HumanMessage(content=params.message)]

        # Run agent
        final_answer, tools_used = await self._run_agent(agent, messages)

        # Extract token usage
        token_usage = TokenUsage(
            input_tokens=estimate_tokens(params.message),
            output_tokens=estimate_tokens(final_answer),
            embedding_tokens=0
        )

        # Save to history
        session_history.add_user_message(HumanMessage(content=params.message))
        session_history.add_ai_message(HumanMessage(content=final_answer))

        return ChatResponseData(
            response=final_answer,
            session_id=params.session_id,
            mode="agent",
            tools_used=tools_used,
            token_usage=token_usage
        )

    async def _process_without_tools(
        self,
        params: ChatRequestParams,
        context: ChatContext,
        llm
    ) -> ChatResponseData:
        """Process agent mode without tools (fallback)"""
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
        from langchain_core.messages import HumanMessage
        from src.services import rag_system
        from src.services.chat_helpers import ChatHistoryManager, AgentPromptBuilder
        from src.utils.utils import extract_token_usage, estimate_tokens

        history = ChatHistoryManager.get_history(
            params.session_id, params.user_id, params.db
        )
        session_history = ChatHistoryManager.get_session_history(
            params.session_id, params.user_id, params.db
        )

        context_text = rag_system.retrieve_context(params.message)
        system_message = AgentPromptBuilder.create_agent_prompt(params.agent_prompt)
        system_message = system_message.replace("{context}", context_text)

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        response = llm.invoke(prompt.format(
            context=context_text,
            chat_history=history,
            input=params.message
        ))

        answer = response.content if hasattr(response, 'content') else str(response)

        input_tokens, output_tokens, embedding_tokens = extract_token_usage(response)
        if input_tokens == 0 and output_tokens == 0:
            input_tokens = estimate_tokens(f"{params.message} {context_text}")
            output_tokens = estimate_tokens(answer)

        session_history.add_user_message(HumanMessage(content=params.message))
        session_history.add_ai_message(HumanMessage(content=answer))

        return ChatResponseData(
            response=answer,
            session_id=params.session_id,
            mode="agent",
            tools_used=[],
            token_usage=TokenUsage(
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                embedding_tokens=embedding_tokens
            )
        )

    async def _run_agent(self, agent, messages: list) -> tuple[str, list]:
        """Run agent and extract answer"""
        from src.services.chat_helpers import ContentNormalizer

        final_answer = ""
        tools_used = []

        async for event in agent.astream({"messages": messages}, stream_mode="values"):
            event_messages = event.get("messages", [])
            normalized_messages = self._normalize_messages(event_messages)
            event["messages"] = normalized_messages

            last_msg = normalized_messages[-1] if normalized_messages else None

            from langchain_core.messages import AIMessage
            if isinstance(last_msg, AIMessage):
                if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                    for call in last_msg.tool_calls:
                        tools_used.append(call.get('name', 'unknown'))
                else:
                    final_answer = ContentNormalizer.normalize_content(last_msg.content)

        return final_answer, tools_used

    def _normalize_messages(self, messages):
        """Normalize messages"""
        from src.services.chat_helpers import ContentNormalizer
        from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

        normalized = []
        for msg in messages:
            if not isinstance(msg, BaseMessage):
                normalized.append(msg)
                continue

            if isinstance(msg.content, str):
                normalized.append(msg)
                continue

            normalized_content = ContentNormalizer.normalize_content(msg.content)

            if isinstance(msg, HumanMessage):
                normalized.append(HumanMessage(content=normalized_content))
            elif isinstance(msg, AIMessage):
                new_msg = AIMessage(content=normalized_content)
                if hasattr(msg, 'tool_calls'):
                    new_msg.tool_calls = msg.tool_calls
                normalized.append(new_msg)
            elif isinstance(msg, SystemMessage):
                normalized.append(SystemMessage(content=normalized_content))
            else:
                msg.content = normalized_content
                normalized.append(msg)

        return normalized

    def get_mode(self) -> str:
        return "agent"


class ChatStrategyFactory:
    """Factory for creating chat strategies"""

    _strategies = {
        "rag": RAGChatStrategy,
        "agent": AgentChatStrategy,
    }

    @classmethod
    def create_strategy(cls, mode: str) -> ChatStrategy:
        """Create strategy based on mode"""
        strategy_class = cls._strategies.get(mode.lower())
        if not strategy_class:
            raise ValueError(f"Unknown chat mode: {mode}")
        return strategy_class()

    @classmethod
    def register_strategy(cls, mode: str, strategy_class: type[ChatStrategy]):
        """Register a new strategy"""
        cls._strategies[mode.lower()] = strategy_class

