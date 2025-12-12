"""
LLM Config Builder - Builder Pattern
"""
from typing import Optional, Dict, Any


class LLMConfigBuilder:
    """
    Builder for constructing LLM configuration dictionaries
    Following Builder Pattern
    """

    def __init__(self):
        self._config: Dict[str, Any] = {}

    def with_type(self, provider_type: str) -> "LLMConfigBuilder":
        """Set the LLM provider type"""
        self._config["type"] = provider_type.lower()
        return self

    def with_model(self, model: str) -> "LLMConfigBuilder":
        """Set the model name"""
        self._config["model"] = model
        return self

    def with_api_key(self, api_key: str) -> "LLMConfigBuilder":
        """Set the API key"""
        self._config["api_key"] = api_key
        return self

    def with_base_url(self, base_url: str) -> "LLMConfigBuilder":
        """Set the base URL"""
        self._config["base_url"] = base_url
        return self

    def with_api_base(self, api_base: str) -> "LLMConfigBuilder":
        """Set the API base"""
        self._config["api_base"] = api_base
        return self

    def with_user_id(self, user_id: Optional[int]) -> "LLMConfigBuilder":
        """Set the user ID"""
        self._config["user_id"] = user_id
        return self

    def as_default(self, is_default: bool = True) -> "LLMConfigBuilder":
        """Mark as default config"""
        self._config["is_default"] = is_default
        return self

    def as_active(self, active: bool = True) -> "LLMConfigBuilder":
        """Mark as active"""
        self._config["active"] = active
        return self

    def build(self) -> Dict[str, Any]:
        """Build the configuration dictionary"""
        return self._config.copy()

    @classmethod
    def create_openai_config(
        cls,
        model: str = "gpt-4o",
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create OpenAI configuration"""
        return cls().with_type("openai").with_model(model).with_api_key(api_key or "").build()

    @classmethod
    def create_gemini_config(
        cls,
        model: str = "gemini-2.0-flash",
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create Gemini configuration"""
        return cls().with_type("gemini").with_model(model).with_api_key(api_key or "").build()

    @classmethod
    def create_ollama_config(
        cls,
        model: str = "llama3",
        base_url: str = "http://localhost:11434"
    ) -> Dict[str, Any]:
        """Create Ollama configuration"""
        return cls().with_type("ollama").with_model(model).with_base_url(base_url).build()

