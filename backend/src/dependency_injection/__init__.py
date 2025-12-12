"""
Dependency Injection Container
Following Dependency Injection Pattern
"""
from .container import Container, get_container
from .providers import ServiceProvider

__all__ = [
    "Container",
    "get_container",
    "ServiceProvider",
]

