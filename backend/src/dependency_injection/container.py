"""
Dependency Injection Container
Following Dependency Injection Pattern

Simple DI container - not using a full framework like injector or dependency-injector
to keep dependencies minimal. This works fine for our needs.
"""
from typing import Dict, Callable, Any, Optional, TypeVar, Type
from functools import lru_cache

T = TypeVar('T')


class Container:
    """
    Simple Dependency Injection Container
    Following Dependency Injection Pattern

    Basic implementation - could use a library but keeping it simple.
    Supports both instances and factories, with optional singleton pattern.
    """

    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._singletons: Dict[str, Any] = {}

    def register(self, service_name: str, service: Any, singleton: bool = False):
        """Register a service"""
        if singleton:
            self._singletons[service_name] = service
        else:
            self._services[service_name] = service

    def register_factory(self, service_name: str, factory: Callable, singleton: bool = False):
        """Register a factory function"""
        self._factories[service_name] = (factory, singleton)

    def get(self, service_name: str) -> Any:
        """Get a service instance"""
        # Check singletons first (cached instances)
        if service_name in self._singletons:
            return self._singletons[service_name]

        # Check direct service registrations
        if service_name in self._services:
            return self._services[service_name]

        # Check factories - create on demand
        if service_name in self._factories:
            factory, singleton = self._factories[service_name]
            instance = factory()
            if singleton:
                self._singletons[service_name] = instance  # Cache if singleton
            return instance

        raise ValueError(f"Service '{service_name}' not found")

    def has(self, service_name: str) -> bool:
        """Check if service is registered"""
        return (
            service_name in self._services or
            service_name in self._factories or
            service_name in self._singletons
        )

    def clear(self):
        """Clear all registered services"""
        self._services.clear()
        self._factories.clear()
        self._singletons.clear()


# Global container instance
_container: Optional[Container] = None


def get_container() -> Container:
    """Get the global container instance (Singleton)"""
    global _container
    if _container is None:
        _container = Container()
    return _container

