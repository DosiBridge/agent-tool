"""
Database configuration and session management
"""
import os
from contextlib import contextmanager
from typing import Optional

# Try to import database dependencies
try:
    from sqlalchemy import create_engine
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker, Session
    DB_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  SQLAlchemy not available: {e}")
    DB_AVAILABLE = False
    Session = None  # type: ignore
    Base = None  # type: ignore

# Try to import psycopg2
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("⚠️  psycopg2 not available. Install with: pip install psycopg2-binary")

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sazib:1234@localhost:5432/mcpagent"
)

# Initialize database components only if available
if DB_AVAILABLE and PSYCOPG2_AVAILABLE:
    try:
        # Create engine
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,  # Verify connections before using
            pool_size=10,
            max_overflow=20,
            echo=False  # Set to True for SQL query logging
        )
        
        # Create session factory
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Base class for models
        Base = declarative_base()
        
        print("✓ Database components initialized")
    except Exception as e:
        print(f"⚠️  Failed to initialize database engine: {e}")
        DB_AVAILABLE = False
        engine = None  # type: ignore
        SessionLocal = None  # type: ignore
        Base = None  # type: ignore
else:
    engine = None  # type: ignore
    SessionLocal = None  # type: ignore
    Base = None  # type: ignore


def get_db():
    """
    Dependency function for FastAPI to get database session.
    Usage: db: Session = Depends(get_db)
    """
    if not DB_AVAILABLE or not SessionLocal:
        raise RuntimeError("Database is not available. Please install psycopg2-binary and ensure DATABASE_URL is set.")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database sessions.
    Usage:
        with get_db_context() as db:
            # use db
    """
    if not DB_AVAILABLE or not SessionLocal:
        raise RuntimeError("Database is not available. Please install psycopg2-binary and ensure DATABASE_URL is set.")
    
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    Call this on application startup.
    """
    if not DB_AVAILABLE or not engine or not Base:
        print("⚠️  Database not available, skipping initialization")
        return
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables initialized")
    except Exception as e:
        print(f"⚠️  Failed to initialize database tables: {e}")

