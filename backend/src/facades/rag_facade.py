"""
RAG Facade - Facade Pattern
Simplifies the complex RAG subsystem
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from src.services.advanced_rag import advanced_rag_system
from src.services import rag_system
from src.services.chat_conditionals import ConditionalHelpers


class RAGFacade:
    """
    Facade for RAG operations
    Following Facade Pattern - simplifies complex RAG subsystem
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def retrieve_context(
        self,
        query: str,
        user_id: Optional[int] = None,
        collection_id: Optional[int] = None,
        k: int = 5
    ) -> str:
        """
        Retrieve context for a query
        Simplified interface that hides complexity
        """
        if ConditionalHelpers.should_use_advanced_rag(user_id):
            retrieved_docs = advanced_rag_system.retrieve(
                query=query,
                user_id=user_id,
                k=k,
                use_reranking=True,
                use_hybrid=True,
                collection_id=collection_id
            )

            context_parts = []
            for doc in retrieved_docs:
                content = doc["content"]
                metadata = doc.get("metadata", {})
                source = metadata.get("original_filename", "Document")
                context_parts.append(f"[{source}]\n{content}\n")

            return "\n".join(context_parts) if context_parts else "No relevant documents found."
        else:
            return rag_system.retrieve_context(query)

    def retrieve_documents(
        self,
        query: str,
        user_id: int,
        collection_id: Optional[int] = None,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve documents for a query
        Returns list of document dictionaries
        """
        if not user_id:
            return []

        return advanced_rag_system.retrieve(
            query=query,
            user_id=user_id,
            k=k,
            use_reranking=True,
            use_hybrid=True,
            collection_id=collection_id
        )

