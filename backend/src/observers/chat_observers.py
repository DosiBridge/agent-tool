"""
Chat Event Observers - Observer Pattern

Observers that react to chat events. Each observer does one thing:
- Track usage
- Log events
- Track errors

Easy to add more observers without changing existing code.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from .event_dispatcher import Event, EventType
from src.services.usage_tracker import usage_tracker


class ChatEventObserver:
    """Base observer for chat events - override handle_event in subclasses"""

    def handle_event(self, event: Event):
        """Handle an event - override this"""
        pass


class UsageTrackingObserver(ChatEventObserver):
    """
    Observer that tracks usage for chat events

    Records token usage and request counts. Called automatically
    when chat requests complete via the event system.
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def handle_event(self, event: Event):
        """Track usage when chat request completes"""
        if event.event_type == EventType.CHAT_REQUEST_COMPLETED:
            # Extract data and record usage
            data = event.data
            usage_tracker.record_request(
                user_id=data.get("user_id"),
                db=self.db,
                llm_provider=data.get("llm_provider"),
                llm_model=data.get("llm_model"),
                input_tokens=data.get("input_tokens", 0),
                output_tokens=data.get("output_tokens", 0),
                embedding_tokens=data.get("embedding_tokens", 0),
                mode=data.get("mode"),
                session_id=data.get("session_id"),
                success=data.get("success", True),
                ip_address=data.get("ip_address"),
                guest_email=data.get("guest_email")
            )


class LoggingObserver(ChatEventObserver):
    """Observer that logs chat events"""

    def handle_event(self, event: Event):
        """Log the event"""
        from src.utils.logger import app_logger

        app_logger.info(
            f"Chat event: {event.event_type.value}",
            event.data
        )


class ErrorTrackingObserver(ChatEventObserver):
    """Observer that tracks errors"""

    def handle_event(self, event: Event):
        """Track errors"""
        if event.event_type == EventType.CHAT_REQUEST_FAILED:
            from src.utils.logger import app_logger

            app_logger.error(
                "Chat request failed",
                event.data,
                exc_info=True
            )

