# Database & LLM Management Explanation

This document explains how the database connection and LLM configuration management works in this project.

## Overview

The system uses **PostgreSQL** as the database to store:
- **LLM Configurations** (model settings, API keys)
- **MCP Server Configurations** (external tool servers)
- **User Accounts** (authentication)

The database connection and LLM configuration are automatically managed on application startup.

---

## 1. Database Connection Setup

### Configuration (`backend/src/database.py`)

**Step 1: Environment Variable**
```python
DATABASE_URL = os.getenv("DATABASE_URL")
```
- The `DATABASE_URL` **must** be set as an environment variable
- Format: `postgresql://username:password@host:port/database`
- Example: `postgresql://sazib:1234@host.docker.internal:5432/mcpagent`
- **No hardcoded fallback** - ensures explicit configuration

**Step 2: Database Engine Creation**
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Verify connections before using
    pool_size=10,            # Connection pool size
    max_overflow=20,         # Additional connections if needed
    echo=False               # SQL query logging (set True for debugging)
)
```

**Step 3: Session Management**
- `SessionLocal`: Factory for creating database sessions
- `get_db()`: FastAPI dependency for request-scoped sessions
- `get_db_context()`: Context manager for manual session handling

### Connection Flow

```
Application Start
    ↓
Read DATABASE_URL from environment
    ↓
Create SQLAlchemy Engine
    ↓
Create Session Factory
    ↓
Database Ready ✓
```

---

## 2. Database Initialization

### Table Creation (`init_db()` function)

**When it runs:**
- Automatically on application startup (via `lifespan.py`)
- Creates all tables defined in `models.py` if they don't exist

**What it does:**
1. **Creates tables** using SQLAlchemy metadata:
   - `users` - User accounts
   - `llm_config` - LLM model configurations
   - `mcp_servers` - MCP server configurations

2. **Runs migrations** (if needed):
   - Adds `user_id` column to `mcp_servers` table
   - Adds `user_id` column to `llm_config` table
   - Creates indexes for performance
   - Updates unique constraints

**Code Flow:**
```python
def init_db():
    Base.metadata.create_all(bind=engine)  # Create all tables
    # Run migration checks...
```

---

## 3. LLM Configuration Management

### Database Model (`backend/src/models.py`)

The `LLMConfig` table stores:
```python
class LLMConfig:
    id: Integer (Primary Key)
    user_id: Integer (Optional - for user-specific configs)
    type: String (e.g., "openai", "gemini", "ollama")
    model: String (e.g., "gpt-4o", "gemini-2.0-flash")
    api_key: Text (Encrypted/stored securely)
    base_url: String (Optional - for custom endpoints)
    api_base: String (Optional - alternative base URL)
    active: Boolean (Only one active at a time)
    created_at: DateTime
    updated_at: DateTime
```

### Primary LLM Model Auto-Creation (`backend/src/api/lifespan.py`)

**On every application startup, the system:**

1. **Checks if primary model exists:**
   ```python
   primary_config = db.query(LLMConfig).filter(
       LLMConfig.type == "openai",
       LLMConfig.model == "gpt-4o"
   ).first()
   ```

2. **If exists:**
   - Updates API key from `OPENAI_API_KEY` environment variable (if provided)
   - Ensures it's marked as `active=True`
   - Commits changes

3. **If doesn't exist:**
   - Creates new `LLMConfig` record:
     ```python
     primary_config = LLMConfig(
         type="openai",
         model="gpt-4o",
         api_key=openai_api_key,  # From OPENAI_API_KEY env var
         active=True
     )
     ```
   - Saves to database

4. **Ensures primary model is the only active one:**
   - Deactivates any other active LLM configurations
   - Ensures `gpt-4o` is always the primary/active model

### Complete Startup Flow

```
Application Start
    ↓
init_db() - Create tables if needed
    ↓
Check if primary LLM (gpt-4o) exists
    ↓
    ├─→ EXISTS: Update API key, ensure active
    └─→ NOT EXISTS: Create new primary LLM config
    ↓
Deactivate other LLM configs (if any)
    ↓
Application Ready ✓
```

---

## 4. How LLM Config is Used

### Loading LLM Configuration

**In API routes** (`backend/src/api/routes/chat.py`):
```python
# Get LLM config from database
llm_config = Config.load_llm_config(db=db)

# Create LLM instance
llm = create_llm_from_config(llm_config, streaming=False, temperature=0)
```

**The `load_llm_config()` function:**
1. Queries database for active LLM config
2. Returns configuration dictionary with API key
3. Falls back to environment variables if API key missing in DB

### API Key Priority

1. **Database** - API key stored in `llm_config` table
2. **Environment** - `OPENAI_API_KEY` environment variable (used as fallback)
3. **Error** - If neither exists, LLM won't work (but app still runs)

---

## 5. Database Connection Lifecycle

### On Application Startup

```
1. Read DATABASE_URL from environment
   ↓
2. Create database engine and session factory
   ↓
3. Call init_db() - Create tables
   ↓
4. Check/Create primary LLM model (gpt-4o)
   ↓
5. Application ready to accept requests
```

### During Runtime

**For each API request:**
```
Request arrives
    ↓
FastAPI dependency: get_db()
    ↓
Create new database session
    ↓
Execute query/operation
    ↓
Auto-commit (if using get_db_context)
    ↓
Close session
```

**Connection Pooling:**
- SQLAlchemy maintains a pool of connections
- Reuses connections for efficiency
- `pool_pre_ping=True` verifies connections are alive before use

---

## 6. Key Features

### ✅ Automatic Setup
- Tables created automatically on first run
- Primary LLM model created automatically
- No manual database setup required

### ✅ Environment-Based Configuration
- `DATABASE_URL` - Database connection string
- `OPENAI_API_KEY` - Primary LLM API key
- No hardcoded values

### ✅ Primary Model Management
- **gpt-4o** is always the primary model
- Automatically created if missing
- Always set as active
- Other models are deactivated

### ✅ Multi-User Support
- `user_id` column allows user-specific configs
- Primary model is global (user_id = NULL)
- Users can have their own LLM configs

### ✅ Error Handling
- Graceful fallback if database unavailable
- Clear error messages
- Application continues even if LLM config missing

---

## 7. Example Scenarios

### Scenario 1: First Time Setup

```
1. User sets DATABASE_URL in docker-compose.yml
2. User sets OPENAI_API_KEY in docker-compose.yml
3. Run: docker-compose up -d
4. Backend starts:
   - Connects to database
   - Creates all tables
   - Creates primary LLM (gpt-4o) with API key
   - Ready to use ✓
```

### Scenario 2: Existing Database

```
1. Backend connects to existing database
2. Tables already exist (skips creation)
3. Checks for primary LLM (gpt-4o)
4. If exists: Updates API key from environment
5. If missing: Creates it
6. Ready to use ✓
```

### Scenario 3: New Machine / Different Database

```
1. User updates DATABASE_URL to point to new database
2. Backend connects to new database
3. Creates all tables (fresh database)
4. Creates primary LLM (gpt-4o) automatically
5. Uses OPENAI_API_KEY from environment
6. Ready to use ✓
```

---

## 8. Database Tables Structure

### `llm_config` Table
```sql
CREATE TABLE llm_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'openai',
    model VARCHAR(200) NOT NULL,
    api_key TEXT,
    base_url VARCHAR(500),
    api_base VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### `mcp_servers` Table
```sql
CREATE TABLE mcp_servers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    api_key TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, name)
);
```

### `users` Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

---

## 9. Troubleshooting

### Database Connection Issues

**Error: "DATABASE_URL environment variable is required"**
- Solution: Set `DATABASE_URL` in docker-compose.yml or environment

**Error: "Failed to initialize database engine"**
- Check: Database is running and accessible
- Check: `DATABASE_URL` format is correct
- Check: Network connectivity (for remote databases)

### LLM Configuration Issues

**Warning: "OPENAI_API_KEY is not set in environment"**
- Solution: Set `OPENAI_API_KEY` in docker-compose.yml
- Note: App will still run, but LLM won't work

**Primary model not created:**
- Check: Database connection is working
- Check: Application logs for errors
- Check: `llm_config` table exists

---

## 10. Summary

**Database Management:**
- ✅ Automatic table creation
- ✅ Connection pooling
- ✅ Environment-based configuration
- ✅ Error handling and fallbacks

**LLM Management:**
- ✅ Primary model (gpt-4o) auto-created
- ✅ API key from environment
- ✅ Always active and ready
- ✅ Works on any machine with database access

**Key Benefits:**
- No manual setup required
- Works on any local machine
- Automatic configuration
- Production-ready error handling

