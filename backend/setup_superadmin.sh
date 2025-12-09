#!/bin/bash
# Helper script to set up superadmin with proper environment

cd "$(dirname "$0")"

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Please create one first:"
    echo "   python -m venv .venv"
    echo "   source .venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Make sure DATABASE_URL is set in your environment"
fi

# Run add_role_column.py first (idempotent - safe to run multiple times)
echo "🔄 Adding role column to users table..."
python add_role_column.py

# Run create_superadmin.py
echo ""
echo "🔄 Creating superadmin user..."
python create_superadmin.py

