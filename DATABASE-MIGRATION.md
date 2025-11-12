# PostgreSQL Database Migration Guide

## Overview

The backend has been migrated from static JSON files to PostgreSQL database for storing:
- LLM Configuration
- MCP Server Configuration

## Database Setup

### Database Credentials
- **Database Name**: `mcpagent`
- **Username**: `sazib`
- **Password**: `1234`
- **Host**: `postgres` (in Docker) or `localhost` (local)
- **Port**: `5432`

### Docker Compose

The `docker-compose.yml` now includes a PostgreSQL service that:
- Automatically creates the database on first run
- Persists data in a Docker volume
- Has health checks to ensure it's ready before the backend starts

## Migration Steps

### 1. Start the Services

```bash
docker-compose up -d postgres
# Wait for postgres to be healthy
docker-compose up -d agent-backend
```

### 2. Initialize Database and Migrate Data

The database will be automatically initialized when the backend starts. However, to migrate existing JSON data:

```bash
# Inside the backend container
docker-compose exec agent-backend python init_db.py
```

Or manually:
```bash
docker-compose exec agent-backend python -m src.migrate_to_db
```

### 3. Verify Migration

Check that data was migrated:
```bash
# Connect to database
docker-compose exec postgres psql -U sazib -d mcpagent

# Check tables
\dt

# Check LLM config
SELECT * FROM llm_config;

# Check MCP servers
SELECT name, url, enabled FROM mcp_servers;
```

## Database Schema

### `llm_config` Table
- `id` (Primary Key)
- `type` (String): LLM provider type (openai, gemini, ollama, groq)
- `model` (String): Model name
- `api_key` (Text): API key (stored securely)
- `base_url` (String): Base URL for custom endpoints
- `api_base` (String): Alternative base URL
- `active` (Boolean): Whether this is the active configuration
- `created_at` (DateTime)
- `updated_at` (DateTime)

### `mcp_servers` Table
- `id` (Primary Key)
- `name` (String, Unique): Server name
- `url` (String): Server URL
- `api_key` (Text): Optional API key
- `enabled` (Boolean): Whether server is enabled
- `created_at` (DateTime)
- `updated_at` (DateTime)

## API Changes

All API endpoints now use the database. The endpoints remain the same:

- `GET /api/llm-config` - Get LLM configuration
- `POST /api/llm-config` - Set LLM configuration
- `GET /api/mcp-servers` - List MCP servers
- `POST /api/mcp-servers` - Add MCP server
- `PUT /api/mcp-servers/{name}` - Update MCP server
- `DELETE /api/mcp-servers/{name}` - Delete MCP server
- `PATCH /api/mcp-servers/{name}/toggle` - Toggle server enabled/disabled

## Fallback Behavior

The system will automatically fall back to JSON files if:
- Database is not available
- Database connection fails
- Tables don't exist

This ensures backward compatibility during migration.

## Troubleshooting

### Permission Errors
If you see permission errors when adding MCP servers, the database user has proper permissions. The error was likely from the old JSON file system.

### Database Connection Issues
Check that:
1. PostgreSQL container is running: `docker-compose ps postgres`
2. Database is healthy: `docker-compose logs postgres`
3. DATABASE_URL environment variable is set correctly

### Migration Issues
If migration fails:
1. Check database logs: `docker-compose logs postgres`
2. Verify JSON files exist: `ls -la backend/config/`
3. Run migration manually: `docker-compose exec agent-backend python -m src.migrate_to_db`

## Benefits

✅ **No more permission issues** - Database handles file permissions automatically
✅ **Better concurrency** - Multiple requests can update config simultaneously
✅ **Data persistence** - Data survives container restarts
✅ **Better performance** - Database queries are faster than file I/O
✅ **Scalability** - Can easily add more configuration options

