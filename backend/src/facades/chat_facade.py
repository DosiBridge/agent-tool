"""
Chat Facade - Facade Pattern
Simplifies the complex chat processing subsystem

This hides all the complexity of chat processing behind a simple interface.
Routes can just call process_chat() without worrying about strategies,
repositories, etc. Makes the API layer much cleaner.
"""
from typing import Optional
from sqlalchemy.orm import Session

from src.core import Config, User
from src.services.chat_models import ChatRequestParams, ChatResponseData
from src.services.chat_conditionals import GuardClauseHelpers
from src.strategies.chat_strategy import ChatStrategyFactory, ChatContext
from src.builders.chat_response_builder import ChatResponseBuilder


class ChatFacade:
    """
    Facade for chat processing
    Following Facade Pattern - simplifies complex subsystem

    This is what routes should use instead of calling ChatService directly.
    Handles all the setup, validation, and error handling.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    async def process_chat(
        self,
        message: str,
        session_id: str,
        mode: str,
        user: Optional[User] = None,
        collection_id: Optional[int] = None,
        use_react: bool = False,
        agent_prompt: Optional[str] = None
    ) -> ChatResponseData:
        """
        Process a chat message
        Simplified interface that hides complexity
        """
        # Create parameter object
        params = ChatRequestParams(
            message=message,
            session_id=session_id,
            user_id=user.id if user else None,
            db=self.db,
            collection_id=collection_id,
            use_react=use_react,
            agent_prompt=agent_prompt
        )

        # Validate with guard clauses
        is_valid, error_msg = GuardClauseHelpers.validate_rag_mode_authentication(
            mode, params.user_id
        )
        if not is_valid:
            return ChatResponseBuilder().build_error_response(error_msg or "Invalid request")

        is_valid, error_msg = GuardClauseHelpers.validate_user_active(user)
        if not is_valid:
            return ChatResponseBuilder().build_error_response(error_msg or "User inactive")

        # Load LLM config
        llm_config = Config.load_llm_config(db=self.db, user_id=params.user_id)
        is_valid, error_msg = GuardClauseHelpers.validate_llm_config(llm_config)
        if not is_valid:
            return ChatResponseBuilder().build_error_response(error_msg or "LLM config error")

        # Create context
        context = ChatContext(
            user_id=params.user_id,
            db=self.db,
            llm_config=llm_config or {},
            session_id=session_id,
            message=message
        )

        # Get strategy and process
        strategy = ChatStrategyFactory.create_strategy(mode)
        return await strategy.process(params, context)

