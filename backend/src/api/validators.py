"""
Request/Response validators for API endpoints
"""
from typing import Optional
from pydantic import BaseModel, Field, validator, EmailStr
import re


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries"""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get limit for database queries"""
        return self.page_size


class SessionIDValidator(BaseModel):
    """Validate session ID format"""
    session_id: str = Field(..., min_length=1, max_length=255, description="Session identifier")
    
    @validator('session_id')
    def validate_session_id(cls, v):
        """Validate session ID format"""
        if not v or not v.strip():
            raise ValueError("Session ID cannot be empty")
        # Allow alphanumeric, hyphens, underscores
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("Session ID contains invalid characters")
        return v.strip()


class MessageValidator(BaseModel):
    """Validate chat message"""
    message: str = Field(..., min_length=1, max_length=10000, description="Chat message")
    
    @validator('message')
    def validate_message(cls, v):
        """Validate message content"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        # Check for excessive whitespace
        if len(v.strip()) < 1:
            raise ValueError("Message cannot be only whitespace")
        return v.strip()


class MCPServerNameValidator(BaseModel):
    """Validate MCP server name"""
    name: str = Field(..., min_length=1, max_length=100, description="MCP server name")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate server name format"""
        if not v or not v.strip():
            raise ValueError("Server name cannot be empty")
        # Allow alphanumeric, hyphens, underscores, spaces
        if not re.match(r'^[a-zA-Z0-9_-\s]+$', v):
            raise ValueError("Server name contains invalid characters")
        return v.strip()


class URLValidator(BaseModel):
    """Validate URL format"""
    url: str = Field(..., min_length=1, max_length=500, description="Server URL")
    
    @validator('url')
    def validate_url(cls, v):
        """Validate URL format"""
        if not v or not v.strip():
            raise ValueError("URL cannot be empty")
        # Basic URL validation
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        # Also allow stdio commands (for stdio connection type)
        if not (url_pattern.match(v) or v.startswith('/') or ' ' in v):
            raise ValueError("Invalid URL format")
        return v.strip()


class EmailValidator(BaseModel):
    """Validate email format"""
    email: EmailStr = Field(..., description="User email address")


class PasswordValidator(BaseModel):
    """Validate password strength"""
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must be less than 128 characters")
        # Check for at least one letter and one number
        has_letter = re.search(r'[a-zA-Z]', v)
        has_number = re.search(r'[0-9]', v)
        if not (has_letter and has_number):
            raise ValueError("Password must contain at least one letter and one number")
        return v

