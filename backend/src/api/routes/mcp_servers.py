"""
MCP Server Management Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.config import Config
from src.database import get_db
from src.models import MCPServer
from ..models import MCPServerRequest

router = APIRouter()


@router.get("/mcp-servers")
async def list_mcp_servers(db: Session = Depends(get_db)):
    """List all configured MCP servers"""
    try:
        servers = Config.load_mcp_servers(db=db)
        # Don't send api_key in response for security
        safe_servers = []
        for server in servers:
            safe_server = {k: v for k, v in server.items() if k != "api_key"}
            safe_server["has_api_key"] = bool(server.get("api_key"))
            # Ensure enabled field exists (default to True if not present)
            if "enabled" not in safe_server:
                safe_server["enabled"] = True
            safe_servers.append(safe_server)
        
        return {
            "status": "success",
            "count": len(servers),
            "servers": safe_servers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mcp-servers")
async def add_mcp_server(server: MCPServerRequest, db: Session = Depends(get_db)):
    """Add a new MCP server to the configuration"""
    try:
        # Normalize URL: remove /sse and ensure /mcp endpoint
        normalized_url = server.url.rstrip('/')
        if normalized_url.endswith('/sse'):
            normalized_url = normalized_url[:-4]  # Remove /sse
        if not normalized_url.endswith('/mcp'):
            # If URL doesn't end with /mcp, append it
            normalized_url = normalized_url.rstrip('/') + '/mcp'
        
        # Check if server already exists
        existing = db.query(MCPServer).filter(
            (MCPServer.name == server.name) | (MCPServer.url == normalized_url)
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"MCP server with name '{server.name}' or URL '{normalized_url}' already exists"
            )
        
        # Create new server
        mcp_server = MCPServer(
            name=server.name,
            url=normalized_url,
            api_key=server.api_key if server.api_key else None,
            enabled=server.enabled if server.enabled is not None else True
        )
        db.add(mcp_server)
        db.commit()
        db.refresh(mcp_server)
        
        # Get total count
        total_servers = db.query(MCPServer).count()
        
        return {
            "status": "success",
            "message": f"MCP server '{server.name}' added successfully",
            "server": mcp_server.to_dict(),
            "total_servers": total_servers
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/mcp-servers/{server_name}")
async def delete_mcp_server(server_name: str, db: Session = Depends(get_db)):
    """Delete an MCP server from the configuration"""
    if not server_name or not server_name.strip():
        raise HTTPException(status_code=400, detail="Server name is required")
    
    try:
        # Find server
        mcp_server = db.query(MCPServer).filter(MCPServer.name == server_name).first()
        
        if not mcp_server:
            raise HTTPException(status_code=404, detail=f"MCP server '{server_name}' not found")
        
        # Delete server
        db.delete(mcp_server)
        db.commit()
        
        # Get remaining count
        remaining_count = db.query(MCPServer).count()
        
        return {
            "status": "success",
            "message": f"MCP server '{server_name}' deleted successfully",
            "remaining_servers": remaining_count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/mcp-servers/{server_name}")
async def update_mcp_server(server_name: str, server: MCPServerRequest, db: Session = Depends(get_db)):
    """Update an existing MCP server"""
    if not server_name or not server_name.strip():
        raise HTTPException(status_code=400, detail="Server name is required")
    if not server.name or not server.name.strip():
        raise HTTPException(status_code=400, detail="Server name in request body is required")
    
    try:
        # Find server
        mcp_server = db.query(MCPServer).filter(MCPServer.name == server_name).first()
        
        if not mcp_server:
            raise HTTPException(status_code=404, detail=f"MCP server '{server_name}' not found")
        
        # Normalize URL: remove /sse and ensure /mcp endpoint
        normalized_url = server.url.rstrip('/')
        if normalized_url.endswith('/sse'):
            normalized_url = normalized_url[:-4]  # Remove /sse
        if not normalized_url.endswith('/mcp'):
            # If URL doesn't end with /mcp, append it
            normalized_url = normalized_url.rstrip('/') + '/mcp'
        
        # Update server
        mcp_server.name = server.name
        mcp_server.url = normalized_url
        mcp_server.enabled = server.enabled if server.enabled is not None else True
        if server.api_key:
            mcp_server.api_key = server.api_key
        
        db.commit()
        db.refresh(mcp_server)
        
        return {
            "status": "success",
            "message": f"MCP server '{server_name}' updated successfully",
            "server": mcp_server.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/mcp-servers/{server_name}/toggle")
async def toggle_mcp_server(server_name: str, db: Session = Depends(get_db)):
    """Toggle enabled/disabled status of an MCP server"""
    if not server_name or not server_name.strip():
        raise HTTPException(status_code=400, detail="Server name is required")
    
    try:
        # Find server
        mcp_server = db.query(MCPServer).filter(MCPServer.name == server_name).first()
        
        if not mcp_server:
            raise HTTPException(status_code=404, detail=f"MCP server '{server_name}' not found")
        
        # Toggle enabled status
        mcp_server.enabled = not mcp_server.enabled
        db.commit()
        db.refresh(mcp_server)
        
        return {
            "status": "success",
            "message": f"MCP server '{server_name}' {'enabled' if mcp_server.enabled else 'disabled'}",
            "server": mcp_server.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

