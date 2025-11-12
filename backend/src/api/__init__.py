"""
FastAPI application with streaming chat endpoints
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .lifespan import mcp_lifespan
from .routes import (
    chat_router,
    sessions_router,
    tools_router,
    mcp_servers_router,
    llm_config_router,
    mcp_routes_router,
    setup_mcp_routes,
)

# Initialize FastAPI app with MCP lifespan
app = FastAPI(
    title="AI MCP Agent API",
    description="Intelligent agent with RAG, MCP tools, and conversation memory",
    version="1.0.0",
    lifespan=mcp_lifespan
)

# Configure CORS origins from environment variable only
# Format: comma-separated list of origins, e.g., "http://localhost:3000,http://localhost:3001,https://example.com"
CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "")
if not CORS_ORIGINS_ENV:
    raise ValueError(
        "CORS_ORIGINS environment variable is required. "
        "Set it to a comma-separated list of allowed origins, e.g., "
        "CORS_ORIGINS='https://agent.dosibridge.com,http://localhost:8086'"
    )

# Parse comma-separated origins
cors_origins = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]
if not cors_origins:
    raise ValueError("CORS_ORIGINS environment variable is empty or invalid")

print(f"✅ CORS configured with origins: {cors_origins}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers to the client
)

# Include routers
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(sessions_router, prefix="/api", tags=["sessions"])
app.include_router(tools_router, prefix="/api", tags=["tools"])
app.include_router(mcp_servers_router, prefix="/api", tags=["mcp-servers"])
app.include_router(llm_config_router, prefix="/api", tags=["llm-config"])
app.include_router(mcp_routes_router, prefix="/api", tags=["mcp-routes"])

# Setup MCP routes
setup_mcp_routes(app)

# Health check and root endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "AI MCP Agent API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

