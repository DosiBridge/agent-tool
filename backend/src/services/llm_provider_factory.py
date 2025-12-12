"""
LLM Provider Factory
Following Refactoring.Guru: Replace Conditional with Polymorphism, Factory Method Pattern
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from langchain_core.language_models import BaseChatModel

from src.services.llm_factory import create_llm_from_config
from src.services.chat_models import LLMConfig as LLMConfigModel


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.type = config.get("type", "").lower()
        self.model = config.get("model", "")
        self.api_key = config.get("api_key")
        self.base_url = config.get("base_url")
        self.api_base = config.get("api_base")

    @abstractmethod
    def create_llm(self, streaming: bool = False, temperature: float = 0.0) -> BaseChatModel:
        """Create LLM instance"""
        pass

    @abstractmethod
    def supports_tools(self) -> bool:
        """Check if provider supports tool calling"""
        pass

    def get_config_dict(self) -> Dict[str, Any]:
        """Get configuration dictionary"""
        return {
            "type": self.type,
            "model": self.model,
            "api_key": self.api_key,
            "base_url": self.base_url,
            "api_base": self.api_base
        }


class OpenAIProvider(LLMProvider):
    """OpenAI LLM provider"""

    def create_llm(self, streaming: bool = False, temperature: float = 0.0) -> BaseChatModel:
        """Create OpenAI LLM instance"""
        return create_llm_from_config(self.config, streaming=streaming, temperature=temperature)

    def supports_tools(self) -> bool:
        """OpenAI supports tool calling"""
        return True


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider"""

    def create_llm(self, streaming: bool = False, temperature: float = 0.0) -> BaseChatModel:
        """Create Gemini LLM instance"""
        return create_llm_from_config(self.config, streaming=streaming, temperature=temperature)

    def supports_tools(self) -> bool:
        """Gemini supports tool calling"""
        return True


class GroqProvider(LLMProvider):
    """Groq LLM provider"""

    def create_llm(self, streaming: bool = False, temperature: float = 0.0) -> BaseChatModel:
        """Create Groq LLM instance"""
        return create_llm_from_config(self.config, streaming=streaming, temperature=temperature)

    def supports_tools(self) -> bool:
        """Groq supports tool calling"""
        return True


class OllamaProvider(LLMProvider):
    """Ollama LLM provider"""

    def create_llm(self, streaming: bool = False, temperature: float = 0.0) -> BaseChatModel:
        """Create Ollama LLM instance"""
        return create_llm_from_config(self.config, streaming=streaming, temperature=temperature)

    def supports_tools(self) -> bool:
        """Ollama does NOT support tool calling"""
        return False


class DeepSeekProvider(LLMProvider):
    """DeepSeek LLM provider"""

    def create_llm(self, streaming: bool = False, temperature: float = 0.0) -> BaseChatModel:
        """Create DeepSeek LLM instance"""
        return create_llm_from_config(self.config, streaming=streaming, temperature=temperature)

    def supports_tools(self) -> bool:
        """DeepSeek supports tool calling"""
        return True


class LLMProviderFactory:
    """Factory for creating LLM providers"""

    _providers = {
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
        "groq": GroqProvider,
        "ollama": OllamaProvider,
        "deepseek": DeepSeekProvider,
    }

    @classmethod
    def create_provider(cls, config: Dict[str, Any]) -> LLMProvider:
        """
        Create LLM provider based on config
        Following Refactoring.Guru: Replace Conditional with Polymorphism, Factory Method
        """
        provider_type = config.get("type", "").lower()
        provider_class = cls._providers.get(provider_type)

        if not provider_class:
            # Default to OpenAI if unknown type
            provider_class = OpenAIProvider

        return provider_class(config)

    @classmethod
    def register_provider(cls, provider_type: str, provider_class: type):
        """Register a new provider type"""
        cls._providers[provider_type.lower()] = provider_class

