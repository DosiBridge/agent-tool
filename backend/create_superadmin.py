"""
Script to create superadmin user
Run this script to create the superadmin user.
Email and password are read from environment variables:
- SUPERADMIN_EMAIL (default: super@mail.com)
- SUPERADMIN_PASSWORD (default: sparrow)
"""
import os
import sys
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not available, use environment variables directly

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from src.core.database import get_db_context
from src.core.models import User
from src.core.auth import get_password_hash

def create_superadmin():
    """Create superadmin user if it doesn't exist"""
    # Get email and password from environment variables
    superadmin_email = os.getenv("SUPERADMIN_EMAIL", "super@mail.com")
    superadmin_password = os.getenv("SUPERADMIN_PASSWORD", "sparrow")
    
    if not superadmin_email or not superadmin_password:
        print("❌ Error: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set")
        print("   Set them in .env file or as environment variables")
        return
    
    with get_db_context() as db:
        try:
            # Check if superadmin already exists
            existing = db.query(User).filter(User.email == superadmin_email).first()
            if existing:
                # Check if role column exists
                if hasattr(existing, 'role'):
                    if existing.role == "superadmin":
                        print(f"✓ Superadmin user already exists: {superadmin_email}")
                        return
                    else:
                        # Update existing user to superadmin
                        existing.role = "superadmin"
                        existing.is_active = True
                        # Update password if provided
                        if superadmin_password:
                            existing.hashed_password = get_password_hash(superadmin_password)
                        db.commit()
                        print(f"✓ Updated existing user to superadmin: {superadmin_email}")
                        return
                else:
                    # Role column doesn't exist, need to add it first
                    print("⚠️  Role column not found. Please run add_role_column.py first")
                    return
            
            # Create new superadmin user
            hashed_password = get_password_hash(superadmin_password)
            superadmin = User(
                email=superadmin_email,
                name="Super Admin",
                hashed_password=hashed_password,
                is_active=True,
                role="superadmin"
            )
            
            db.add(superadmin)
            db.commit()
            db.refresh(superadmin)
            
            print("✓ Superadmin user created successfully!")
            print(f"  Email: {superadmin_email}")
            print(f"  Password: {'*' * len(superadmin_password)} (hidden)")
            print(f"  Role: superadmin")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error creating superadmin: {e}")
            import traceback
            traceback.print_exc()
            raise

if __name__ == "__main__":
    create_superadmin()
