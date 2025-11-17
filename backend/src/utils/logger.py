"""
Professional logging utilities
"""
import logging
import sys
from datetime import datetime
from typing import Optional, Dict, Any
import json

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Create logger instance
logger = logging.getLogger("dosibridge")


class StructuredLogger:
    """Structured logging with context"""
    
    @staticmethod
    def _format_context(context: Optional[Dict[str, Any]] = None) -> str:
        """Format context as JSON string"""
        if not context:
            return ""
        try:
            return f" | Context: {json.dumps(context, default=str)}"
        except Exception:
            return f" | Context: {str(context)}"
    
    @staticmethod
    def info(message: str, context: Optional[Dict[str, Any]] = None):
        """Log info message with optional context"""
        logger.info(f"{message}{StructuredLogger._format_context(context)}")
    
    @staticmethod
    def warning(message: str, context: Optional[Dict[str, Any]] = None):
        """Log warning message with optional context"""
        logger.warning(f"{message}{StructuredLogger._format_context(context)}")
    
    @staticmethod
    def error(message: str, context: Optional[Dict[str, Any]] = None, exc_info: bool = False):
        """Log error message with optional context and exception info"""
        logger.error(f"{message}{StructuredLogger._format_context(context)}", exc_info=exc_info)
    
    @staticmethod
    def debug(message: str, context: Optional[Dict[str, Any]] = None):
        """Log debug message with optional context"""
        logger.debug(f"{message}{StructuredLogger._format_context(context)}")
    
    @staticmethod
    def critical(message: str, context: Optional[Dict[str, Any]] = None, exc_info: bool = False):
        """Log critical message with optional context and exception info"""
        logger.critical(f"{message}{StructuredLogger._format_context(context)}", exc_info=exc_info)


# Export structured logger
app_logger = StructuredLogger()

