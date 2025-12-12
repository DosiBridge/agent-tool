"""
Misc helper functions
Just random utilities that don't fit anywhere else
"""
from typing import Optional, List, Dict, Any


def chunk_list(items: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split a list into chunks

    Simple utility - probably exists in a library but this works fine.
    """
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def safe_get(d: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Safely get nested dict values

    Example: safe_get(data, "user", "profile", "name")
    Returns None if any key is missing instead of KeyError.
    """
    result = d
    for key in keys:
        if isinstance(result, dict):
            result = result.get(key)
            if result is None:
                return default
        else:
            return default
    return result if result is not None else default


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def is_valid_email(email: str) -> bool:
    """Basic email validation - not perfect but catches obvious issues"""
    if not email or "@" not in email:
        return False
    parts = email.split("@")
    if len(parts) != 2:
        return False
    return len(parts[0]) > 0 and len(parts[1]) > 0 and "." in parts[1]

