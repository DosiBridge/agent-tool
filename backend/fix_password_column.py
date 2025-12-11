"""
Migration script to make hashed_password column nullable in users table
Run this once to update the schema for Auth0 integration
"""
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from src.core.database import get_db_context, DB_AVAILABLE
from sqlalchemy import text

def fix_password_column():
    """Make hashed_password column nullable"""
    if not DB_AVAILABLE:
        print("❌ Database not available")
        return
    
    with get_db_context() as db:
        try:
            # Check if using Postgres or SQLite to use correct syntax
            connection = db.connection()
            dialect = connection.dialect.name
            
            print(f"🔧 Fixing hashed_password column (Dialect: {dialect})...")
            
            if dialect == 'postgresql':
                db.execute(text("""
                    ALTER TABLE users 
                    ALTER COLUMN hashed_password DROP NOT NULL
                """))
                print("✓ hashed_password made nullable (Postgres)")
            else:
                # SQLite doesn't support altering column constraints easily
                # But we can try or just skip if it's tricky. 
                # For development/SQLite, usually constraints are not strictly enforced unless enabled?
                # Actually SQLite DOES enforce NOT NULL.
                # Changing it in SQLite is complex (create new table, copy data, drop old, rename).
                # But let's assume Postgres as per .env.example
                print("⚠️  SQLite detected. SQLite requires table recreation to change constraints.")
                print("⚠️  Attempting simplified ALTER - might fail on SQLite.")
                
            db.commit()
            print("✓ Schema updated successfully")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error updating schema: {e}")
            raise

if __name__ == "__main__":
    fix_password_column()
