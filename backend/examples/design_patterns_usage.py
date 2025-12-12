"""
Examples of using design patterns in the backend
This file demonstrates how to use all implemented patterns
"""
from typing import Optional
from sqlalchemy.orm import Session

# Repository Pattern
from src.repositories import (
    UserRepository,
    LLMConfigRepository,
    ConversationRepository
)

# Strategy Pattern
from src.strategies import ChatStrategyFactory

# Builder Pattern
from src.builders import ChatResponseBuilder, LLMConfigBuilder

# Facade Pattern
from src.facades import ChatFacade, RAGFacade

# Dependency Injection
from src.dependency_injection import get_container, ServiceProvider

# Observer Pattern
from src.observers import event_dispatcher, EventType, UsageTrackingObserver

# Service Layer
from src.core.config_service import ConfigService


def example_repository_pattern(db: Session):
    """Example: Using Repository Pattern"""
    print("=== Repository Pattern Example ===")

    # Create repositories
    user_repo = UserRepository(db)
    llm_repo = LLMConfigRepository(db)

    # Use repository methods
    user = user_repo.find_by_email("user@example.com")
    llm_config = llm_repo.find_active_by_user(user.id if user else None)

    print(f"User: {user.email if user else 'Not found'}")
    print(f"LLM Config: {llm_config.type if llm_config else 'Not found'}")


def example_strategy_pattern():
    """Example: Using Strategy Pattern"""
    print("\n=== Strategy Pattern Example ===")

    # Create strategy based on mode
    rag_strategy = ChatStrategyFactory.create_strategy("rag")
    agent_strategy = ChatStrategyFactory.create_strategy("agent")

    print(f"RAG Strategy Mode: {rag_strategy.get_mode()}")
    print(f"Agent Strategy Mode: {agent_strategy.get_mode()}")


def example_builder_pattern():
    """Example: Using Builder Pattern"""
    print("\n=== Builder Pattern Example ===")

    # Build chat response
    response = (ChatResponseBuilder()
        .with_response("Hello, how can I help you?")
        .with_session_id("session-123")
        .with_mode("rag")
        .add_tool("rag_retrieval")
        .with_token_usage(input_tokens=100, output_tokens=50, embedding_tokens=10)
        .build())

    print(f"Response: {response.response}")
    print(f"Mode: {response.mode}")
    print(f"Tools Used: {response.tools_used}")

    # Build LLM config
    config = (LLMConfigBuilder()
        .with_type("openai")
        .with_model("gpt-4o")
        .with_api_key("sk-...")
        .as_default(True)
        .as_active(True)
        .build())

    print(f"LLM Config: {config}")


def example_facade_pattern(db: Session, user):
    """Example: Using Facade Pattern"""
    print("\n=== Facade Pattern Example ===")

    # Use facade for chat processing
    chat_facade = ChatFacade(db)

    # Simplified interface - hides all complexity
    # response = await chat_facade.process_chat(
    #     message="What is AI?",
    #     session_id="session-123",
    #     mode="rag",
    #     user=user
    # )

    # Use facade for RAG operations
    rag_facade = RAGFacade(db)
    context = rag_facade.retrieve_context(
        query="What is machine learning?",
        user_id=user.id if user else None
    )

    print(f"Retrieved context length: {len(context)}")


def example_dependency_injection(db: Session):
    """Example: Using Dependency Injection"""
    print("\n=== Dependency Injection Example ===")

    # Get container
    container = get_container()

    # Register services
    provider = ServiceProvider(container)
    provider.register_repositories(db)
    provider.register_services()
    provider.register_factories()

    # Get services from container
    user_repo = container.get("user_repository")
    usage_tracker = container.get("usage_tracker")

    print(f"User Repository: {type(user_repo).__name__}")
    print(f"Usage Tracker: {type(usage_tracker).__name__}")


def example_observer_pattern(db: Session):
    """Example: Using Observer Pattern"""
    print("\n=== Observer Pattern Example ===")

    # Create observers
    usage_observer = UsageTrackingObserver(db)

    # Subscribe to events
    event_dispatcher.subscribe(
        EventType.CHAT_REQUEST_COMPLETED,
        usage_observer.handle_event
    )

    # Emit events (in real code, this would be done by services)
    event_dispatcher.emit(
        EventType.CHAT_REQUEST_COMPLETED,
        {
            "user_id": 1,
            "llm_provider": "openai",
            "input_tokens": 100,
            "output_tokens": 50,
            "mode": "rag",
            "session_id": "session-123",
            "success": True
        }
    )

    print("Event observers registered and ready")


def example_service_layer(db: Session):
    """Example: Using Service Layer"""
    print("\n=== Service Layer Example ===")

    # Use ConfigService instead of Config class
    config_service = ConfigService(db)

    llm_config = config_service.load_llm_config(user_id=1)
    mcp_servers = config_service.load_mcp_servers(user_id=1)

    print(f"LLM Config: {llm_config.get('type') if llm_config else 'Not found'}")
    print(f"MCP Servers: {len(mcp_servers)}")


def example_combined_patterns(db: Session, user):
    """Example: Combining multiple patterns"""
    print("\n=== Combined Patterns Example ===")

    # 1. Use Repository to get data
    user_repo = UserRepository(db)
    user = user_repo.find_by_email("user@example.com")

    # 2. Use Service to get config
    config_service = ConfigService(db)
    llm_config = config_service.load_llm_config(user_id=user.id if user else None)

    # 3. Use Facade to process chat
    chat_facade = ChatFacade(db)
    # response = await chat_facade.process_chat(...)

    # 4. Use Builder to construct response
    response = (ChatResponseBuilder()
        .with_response("Response")
        .with_session_id("session-123")
        .with_mode("rag")
        .build())

    # 5. Use Observer to track events
    event_dispatcher.emit(
        EventType.CHAT_REQUEST_COMPLETED,
        {"user_id": user.id if user else None}
    )

    print("All patterns working together!")


if __name__ == "__main__":
    print("Design Patterns Usage Examples")
    print("=" * 50)
    print("\nNote: These are examples. In real code, use dependency injection")
    print("to get database sessions and other dependencies.\n")

