"""
Document Repository - Repository Pattern
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from src.repositories.base_repository import BaseRepository
from src.core.models import Document


class DocumentRepository(BaseRepository[Document]):
    """Repository for Document operations"""

    def __init__(self, db: Session):
        super().__init__(db, Document)

    def find_by_user(
        self,
        user_id: int,
        collection_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Document]:
        """Find documents by user with optional filters"""
        query = self.db.query(Document).filter(Document.user_id == user_id)

        if collection_id is not None:
            query = query.filter(Document.collection_id == collection_id)

        if status:
            query = query.filter(Document.status == status)

        return query.order_by(desc(Document.created_at)).all()

    def find_by_collection(self, collection_id: int) -> List[Document]:
        """Find documents by collection"""
        return self.db.query(Document).filter(
            Document.collection_id == collection_id
        ).order_by(desc(Document.created_at)).all()

    def find_ready_documents(self, user_id: int) -> List[Document]:
        """Find ready documents for a user"""
        return self.db.query(Document).filter(
            and_(
                Document.user_id == user_id,
                Document.status == "ready"
            )
        ).all()

    def find_pending_documents(self, user_id: int) -> List[Document]:
        """Find pending documents for a user"""
        return self.db.query(Document).filter(
            and_(
                Document.user_id == user_id,
                Document.status == "pending"
            )
        ).all()

