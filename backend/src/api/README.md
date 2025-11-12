# API Module Structure

This module contains the FastAPI application organized into a clean, modular structure.

## Directory Structure

```
api/
├── __init__.py          # Main FastAPI app initialization
├── models.py            # Pydantic request/response models
├── utils.py             # Utility functions (tool sanitization, error handling)
├── lifespan.py          # Application lifespan management (MCP servers, DB init)
├── routes/              # API route handlers
│   ├── __init__.py      # Route exports
│   ├── chat.py          # Chat endpoints (streaming and non-streaming)
│   ├── sessions.py      # Session management endpoints
│   ├── tools.py         # Tools information endpoints
│   ├── mcp_servers.py   # MCP server management endpoints
│   ├── llm_config.py    # LLM configuration endpoints
│   └── mcp_routes.py    # MCP server routes setup
└── README.md            # This file
```

## Module Overview

### `__init__.py`
- Initializes the FastAPI application
- Configures CORS middleware
- Registers all route routers
- Sets up MCP routes
- Defines root and health check endpoints

### `models.py`
- `ChatRequest`: Request model for chat endpoints
- `ChatResponse`: Response model for chat endpoints
- `SessionInfo`: Session information model
- `MCPServerRequest`: MCP server configuration request
- `LLMConfigRequest`: LLM configuration request

### `utils.py`
- `sanitize_tools_for_gemini()`: Sanitizes tool schemas for Gemini compatibility
- `suppress_mcp_cleanup_errors()`: Suppresses expected MCP cleanup errors

### `lifespan.py`
- `mcp_lifespan()`: Async context manager for MCP server lifecycle
- Initializes database on startup
- Ensures default Gemini config exists
- Manages MCP server sessions

### `routes/chat.py`
- `POST /api/chat`: Non-streaming chat endpoint
- `POST /api/chat/stream`: Streaming chat endpoint (Server-Sent Events)

### `routes/sessions.py`
- `GET /api/session/{session_id}`: Get session information
- `DELETE /api/session/{session_id}`: Clear session history
- `GET /api/sessions`: List all active sessions

### `routes/tools.py`
- `GET /api/tools`: Get information about available tools

### `routes/mcp_servers.py`
- `GET /api/mcp-servers`: List all configured MCP servers
- `POST /api/mcp-servers`: Add a new MCP server
- `DELETE /api/mcp-servers/{server_name}`: Delete an MCP server
- `PUT /api/mcp-servers/{server_name}`: Update an MCP server
- `PATCH /api/mcp-servers/{server_name}/toggle`: Toggle server enabled/disabled

### `routes/llm_config.py`
- `GET /api/llm-config`: Get current LLM configuration
- `POST /api/llm-config`: Set LLM configuration
- `POST /api/llm-config/reset`: Reset to default Gemini configuration

### `routes/mcp_routes.py`
- `GET /api/mcp-servers/available`: List locally available MCP servers
- `GET /api/mcp/{server_name}/info`: Get MCP server information
- `setup_mcp_routes()`: Sets up dynamic routes for MCP servers

## Usage

The API is imported as:
```python
from src.api import app
```

This works because `src/api/__init__.py` exports the `app` instance.

## Benefits of This Structure

1. **Modularity**: Each route group is in its own file
2. **Maintainability**: Easier to find and modify specific endpoints
3. **Scalability**: Easy to add new route files
4. **Separation of Concerns**: Models, utilities, and routes are separated
5. **Testability**: Each module can be tested independently

