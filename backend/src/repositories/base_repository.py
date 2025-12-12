"""
Base Repository - Repository Pattern
Abstract base class for all repositories

Started with basic CRUD, added more methods as needed.
Could probably optimize some queries but works fine for now.
"""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """
    Base repository following Repository Pattern
    Provides common CRUD operations

    TODO: Add bulk operations for better performance
    TODO: Consider adding caching layer
    """

    def __init__(self, db: Session, model_class: type[T]):
        self.db = db
        self.model_class = model_class

    def create(self, **kwargs) -> T:
        """Create a new entity"""
        # Simple create - could add validation here if needed
        entity = self.model_class(**kwargs)
        self.db.add(entity)
        self.db.flush()  # Flush to get ID, but don't commit (caller handles that)
        return entity

    def get_by_id(self, entity_id: int) -> Optional[T]:
        """Get entity by ID"""
        return self.db.query(self.model_class).filter(
            self.model_class.id == entity_id
        ).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all entities with pagination"""
        return self.db.query(self.model_class).offset(skip).limit(limit).all()

    def update(self, entity_id: int, **kwargs) -> Optional[T]:
        """Update an entity"""
        entity = self.get_by_id(entity_id)
        if entity:
            for key, value in kwargs.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)
            self.db.flush()
        return entity

    def delete(self, entity_id: int) -> bool:
        """Delete an entity"""
        entity = self.get_by_id(entity_id)
        if entity:
            self.db.delete(entity)
            self.db.flush()
            return True
        return False

    def find_by(self, **criteria) -> List[T]:
        """Find entities by criteria"""
        query = self.db.query(self.model_class)
        for key, value in criteria.items():
            if hasattr(self.model_class, key):
                query = query.filter(getattr(self.model_class, key) == value)
            # Silently ignore invalid criteria - might want to log this
        return query.all()

    def find_one_by(self, **criteria) -> Optional[T]:
        """Find one entity by criteria"""
        results = self.find_by(**criteria)
        return results[0] if results else None

    def exists(self, entity_id: int) -> bool:
        """Check if entity exists"""
        return self.get_by_id(entity_id) is not None

    def count(self, **criteria) -> int:
        """Count entities matching criteria"""
        query = self.db.query(self.model_class)
        for key, value in criteria.items():
            if hasattr(self.model_class, key):
                query = query.filter(getattr(self.model_class, key) == value)
        return query.count()

