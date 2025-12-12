"""
Event Dispatcher - Observer Pattern

Simple event system for decoupling components. Could use a proper event bus
library but this is lightweight and works fine.
"""
from typing import Dict, List, Callable, Any
from dataclasses import dataclass
from enum import Enum


class EventType(Enum):
    """Event types - add more as needed"""
    CHAT_REQUEST_STARTED = "chat_request_started"
    CHAT_REQUEST_COMPLETED = "chat_request_completed"
    CHAT_REQUEST_FAILED = "chat_request_failed"
    TOOL_CALLED = "tool_called"
    MESSAGE_SAVED = "message_saved"
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_PROCESSED = "document_processed"


@dataclass
class Event:
    """Event data structure - simple but works"""
    event_type: EventType
    data: Dict[str, Any]
    timestamp: float = None

    def __post_init__(self):
        import time
        if self.timestamp is None:
            self.timestamp = time.time()


class EventDispatcher:
    """
    Event dispatcher following Observer Pattern

    Basic pub/sub implementation. Observers can subscribe to events
    and get notified when they happen. Keeps things decoupled.
    """

    def __init__(self):
        self._listeners: Dict[EventType, List[Callable]] = {}

    def subscribe(self, event_type: EventType, callback: Callable[[Event], None]):
        """Subscribe to an event type"""
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(callback)

    def unsubscribe(self, event_type: EventType, callback: Callable[[Event], None]):
        """Unsubscribe from an event type"""
        if event_type in self._listeners:
            self._listeners[event_type].remove(callback)

    def dispatch(self, event: Event):
        """Dispatch an event to all subscribers"""
        if event.event_type in self._listeners:
            for callback in self._listeners[event.event_type]:
                try:
                    callback(event)
                except Exception as e:
                    # Log error but don't stop other observers - one failing shouldn't break everything
                    print(f"Error in event observer: {e}")
                    # TODO: Maybe use proper logger here instead of print

    def emit(self, event_type: EventType, data: Dict[str, Any]):
        """Emit an event"""
        event = Event(event_type=event_type, data=data)
        self.dispatch(event)


# Global event dispatcher instance
event_dispatcher = EventDispatcher()

