"""
Session management endpoints
"""
from fastapi import APIRouter
from langchain_core.messages import HumanMessage
from src.history import history_manager
from ..models import SessionInfo

router = APIRouter()


@router.get("/session/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    """Get session information"""
    messages = history_manager.get_session_messages(session_id)
    
    return SessionInfo(
        session_id=session_id,
        message_count=len(messages),
        messages=[
            {
                "role": "user" if isinstance(msg, HumanMessage) else "assistant",
                "content": msg.content
            }
            for msg in messages
        ]
    )


@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Clear session history"""
    history_manager.clear_session(session_id)
    return {"status": "success", "message": f"Session {session_id} cleared"}


@router.get("/sessions")
async def list_sessions():
    """List all active sessions"""
    sessions = history_manager.list_sessions()
    return {
        "sessions": [
            {
                "session_id": sid,
                "message_count": len(history_manager.get_session_messages(sid))
            }
            for sid in sessions
        ]
    }

