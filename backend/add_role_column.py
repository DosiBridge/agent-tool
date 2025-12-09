"""
Migration script to add role column to users table
Run this once to add the role column to existing databases
"""
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from src.core.database import get_db_context, DB_AVAILABLE
from sqlalchemy import text

def add_role_column():
    """Add role column to users table if it doesn't exist"""
    if not DB_AVAILABLE:
        print("❌ Database not available")
        return
    
    with get_db_context() as db:
        try:
            # Check if column already exists
            result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='role'
            """))
            
            if result.fetchone():
                print("✓ Role column already exists")
            else:
                # Add role column with default value
                db.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN role VARCHAR(50) DEFAULT 'user' NOT NULL
                """))
                
                db.commit()
                print("✓ Role column added successfully")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error adding role column: {e}")
            raise

if __name__ == "__main__":
    add_role_column()

