"""
Environment variables validation
Validates required environment variables on startup
"""
import os
import sys
from typing import List, Tuple, Optional


class EnvValidationError(Exception):
    """Raised when environment validation fails"""
    pass


def validate_environment() -> Tuple[bool, List[str]]:
    """
    Validate required environment variables.
    
    Returns:
        Tuple of (is_valid: bool, errors: List[str])
    """
    errors = []
    warnings = []
    
    # Required variables
    required_vars = {
        "DATABASE_URL": "PostgreSQL database connection string",
        "JWT_SECRET_KEY": "JWT secret key for token signing",
    }
    
    # Check required variables
    for var_name, description in required_vars.items():
        value = os.getenv(var_name)
        if not value:
            errors.append(f"❌ {var_name} is required: {description}")
        elif var_name == "JWT_SECRET_KEY" and value == "your-secret-key-change-in-production-use-env-var":
            # Check if we're in production
            env = os.getenv("ENVIRONMENT", "").lower()
            if env in ("production", "prod") or os.getenv("NODE_ENV", "").lower() == "production":
                errors.append(
                    f"❌ {var_name} must be changed from default value in production environment"
                )
            else:
                warnings.append(
                    f"⚠️  {var_name} is using default value - change it for production"
                )
    
    # Optional but recommended variables
    recommended_vars = {
        "OPENAI_API_KEY": "OpenAI API key for embeddings and OpenAI models",
        "MCP_APIKEY_ENCRYPTION_KEY": "Encryption key for MCP server API keys (recommended for security)",
    }
    
    for var_name, description in recommended_vars.items():
        value = os.getenv(var_name)
        if not value:
            warnings.append(f"⚠️  {var_name} not set: {description}")
    
    # Validate DATABASE_URL format
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if not database_url.startswith(("postgresql://", "postgresql+psycopg2://")):
            errors.append("❌ DATABASE_URL must start with 'postgresql://' or 'postgresql+psycopg2://'")
    
    # Validate CORS_ORIGINS if set
    cors_origins = os.getenv("CORS_ORIGINS")
    if cors_origins:
        origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
        if not origins:
            warnings.append("⚠️  CORS_ORIGINS is set but empty")
    
    return len(errors) == 0, errors + warnings


def print_validation_results(is_valid: bool, messages: List[str]) -> None:
    """Print validation results in a formatted way"""
    if not messages:
        print("✅ All environment variables validated successfully")
        return
    
    print("\n" + "=" * 60)
    print("🔍 Environment Variables Validation")
    print("=" * 60)
    
    for message in messages:
        print(message)
    
    print("=" * 60 + "\n")
    
    if not is_valid:
        print("❌ Environment validation failed!")
        print("   Please fix the errors above before starting the server.")
        print("   See .env.example for required variables.\n")
    else:
        print("✅ Environment validation passed (with warnings)\n")


def validate_and_exit_on_error() -> None:
    """
    Validate environment variables and exit if validation fails.
    Call this on application startup.
    """
    is_valid, messages = validate_environment()
    print_validation_results(is_valid, messages)
    
    if not is_valid:
        print("💡 Tip: Copy .env.example to .env and fill in your values:")
        print("   cp .env.example .env\n")
        sys.exit(1)


def get_required_env(var_name: str, default: Optional[str] = None) -> str:
    """
    Get required environment variable or raise error.
    
    Args:
        var_name: Environment variable name
        default: Optional default value
        
    Returns:
        Environment variable value
        
    Raises:
        EnvValidationError: If variable is not set and no default provided
    """
    value = os.getenv(var_name, default)
    if value is None:
        raise EnvValidationError(
            f"Required environment variable '{var_name}' is not set. "
            f"See .env.example for required variables."
        )
    return value


def get_optional_env(var_name: str, default: Optional[str] = None) -> Optional[str]:
    """
    Get optional environment variable with default.
    
    Args:
        var_name: Environment variable name
        default: Default value if not set
        
    Returns:
        Environment variable value or default
    """
    return os.getenv(var_name, default)

