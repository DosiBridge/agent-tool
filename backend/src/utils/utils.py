"""
Utility functions for API
"""
from langchain_core.tools import BaseTool, StructuredTool
from pydantic import create_model
from typing import Dict, Optional, Tuple
from langchain_core.messages import BaseMessage


def sanitize_tools_for_gemini(tools: list, llm_type: str) -> list:
    """
    Sanitize tools for Gemini compatibility.
    Gemini doesn't support 'any_of' in function schemas when combined with other fields.
    This function creates new tool instances with sanitized schemas.
    """
    if llm_type.lower() != 'gemini':
        return tools
    
    sanitized_tools = []
    for tool in tools:
        if not isinstance(tool, BaseTool):
            sanitized_tools.append(tool)
            continue
        
        try:
            # Check if tool has args_schema that might contain any_of
            if hasattr(tool, 'args_schema') and tool.args_schema:
                # Get the schema
                if hasattr(tool.args_schema, 'schema'):
                    schema_dict = tool.args_schema.schema()
                else:
                    schema_dict = tool.args_schema
                
                # Check if schema has any_of that needs sanitization
                needs_sanitization = False
                
                def check_for_any_of(obj):
                    nonlocal needs_sanitization
                    if isinstance(obj, dict):
                        if 'anyOf' in obj or 'any_of' in obj:
                            needs_sanitization = True
                        for v in obj.values():
                            check_for_any_of(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            check_for_any_of(item)
                
                check_for_any_of(schema_dict)
                
                if needs_sanitization:
                    print(f"🔧 Sanitizing tool '{getattr(tool, 'name', 'unknown')}' schema for Gemini compatibility...")
                    
                    def sanitize_schema_obj(obj):
                        """Recursively sanitize schema objects to remove any_of"""
                        if isinstance(obj, dict):
                            # Create a deep copy to avoid modifying the original
                            obj = obj.copy()
                            
                            # Replace any_of with simpler type
                            if 'anyOf' in obj or 'any_of' in obj:
                                any_of = obj.get('anyOf') or obj.get('any_of', [])
                                type_set = set()
                                for option in any_of:
                                    if isinstance(option, dict):
                                        opt_type = option.get('type')
                                        if opt_type:
                                            type_set.add(opt_type)
                                
                                # Prefer string for flexibility (can accept numbers as strings)
                                new_schema = {'type': 'string'}
                                # Copy description if present
                                if 'description' in obj:
                                    new_schema['description'] = obj['description']
                                return new_schema
                            
                            # Recursively sanitize nested objects
                            if 'properties' in obj:
                                obj['properties'] = {
                                    k: sanitize_schema_obj(v) for k, v in obj['properties'].items()
                                }
                            if 'items' in obj:
                                obj['items'] = sanitize_schema_obj(obj['items'])
                            
                            return obj
                        elif isinstance(obj, list):
                            return [sanitize_schema_obj(item) for item in obj]
                        return obj
                    
                    # Get sanitized schema
                    sanitized_schema_dict = sanitize_schema_obj(schema_dict)
                    
                    # Get the original model for reference
                    original_model = tool.args_schema
                    
                    # Create a new Pydantic model with sanitized schema
                    # Extract properties from sanitized schema
                    properties = sanitized_schema_dict.get('properties', {})
                    
                    # Create field definitions for the new model
                    field_definitions = {}
                    for field_name, field_schema in properties.items():
                        field_type = str  # Default to string since we sanitized to string
                        if field_schema.get('type') == 'number':
                            field_type = float
                        elif field_schema.get('type') == 'integer':
                            field_type = int
                        elif field_schema.get('type') == 'boolean':
                            field_type = bool
                        
                        # Get default value if present
                        default = field_schema.get('default', ...)
                        if default is ...:
                            field_definitions[field_name] = (field_type, ...)
                        else:
                            field_definitions[field_name] = (field_type, default)
                    
                    # Create new model class - this will have NO any_of from the start
                    model_name = f"Sanitized{original_model.__name__ if hasattr(original_model, '__name__') else 'Args'}"
                    SanitizedArgsModel = create_model(
                        model_name,
                        **field_definitions
                    )
                    
                    # Verify the new model's schema doesn't have any_of
                    new_schema = SanitizedArgsModel.model_json_schema()
                    def verify_no_any_of(obj):
                        if isinstance(obj, dict):
                            if 'anyOf' in obj or 'any_of' in obj:
                                raise ValueError(f"Sanitized model still contains any_of: {obj}")
                            for v in obj.values():
                                verify_no_any_of(v)
                        elif isinstance(obj, list):
                            for item in obj:
                                verify_no_any_of(item)
                    verify_no_any_of(new_schema)
                    
                    # Replace the tool's args_schema with the new sanitized model
                    # This ensures LangChain will see the sanitized schema
                    tool.args_schema = SanitizedArgsModel
                    
                    # Also patch the tool's own schema access methods as backup
                    def make_sanitized_method(sanitized_schema):
                        def sanitized_method(*args, **kwargs):
                            return sanitized_schema
                        return sanitized_method
                    
                    sanitized_method = make_sanitized_method(sanitized_schema_dict)
                    if hasattr(tool, '_get_input_schema'):
                        tool._get_input_schema = sanitized_method
                    
                    # Patch any cached schema on the tool
                    if hasattr(tool, '_input_schema'):
                        tool._input_schema = sanitized_schema_dict
                    
                    print(f"✓ Tool '{getattr(tool, 'name', 'unknown')}' schema sanitized")
            
            sanitized_tools.append(tool)
        except Exception as e:
            # If sanitization fails, use original tool
            import traceback
            print(f"⚠️  Warning: Failed to sanitize tool {getattr(tool, 'name', 'unknown')}: {e}")
            print(f"   Traceback: {traceback.format_exc()[:200]}")
            sanitized_tools.append(tool)
    
    return sanitized_tools


def extract_token_usage(response) -> Tuple[int, int, int]:
    """
    Extract token usage from LLM response.
    
    Different LLM providers store token usage in different places:
    - OpenAI/DeepSeek/Groq: response.response_metadata.get('token_usage')
    - Google Gemini: response.response_metadata.get('usage_metadata')
    - Ollama: Usually not available, returns (0, 0, 0)
    
    Args:
        response: LLM response object (AIMessage or raw response)
        
    Returns:
        Tuple of (input_tokens, output_tokens, embedding_tokens)
    """
    input_tokens = 0
    output_tokens = 0
    embedding_tokens = 0
    
    try:
        # Try to get response_metadata from AIMessage
        if hasattr(response, 'response_metadata'):
            metadata = response.response_metadata
            if metadata:
                # OpenAI/DeepSeek/Groq format
                if 'token_usage' in metadata:
                    token_usage = metadata['token_usage']
                    input_tokens = token_usage.get('prompt_tokens', 0)
                    output_tokens = token_usage.get('completion_tokens', 0)
                    embedding_tokens = token_usage.get('total_tokens', 0) - input_tokens - output_tokens
                
                # Google Gemini format
                elif 'usage_metadata' in metadata:
                    usage = metadata['usage_metadata']
                    input_tokens = usage.get('prompt_token_count', 0)
                    output_tokens = usage.get('candidates_token_count', 0)
                    embedding_tokens = 0  # Gemini doesn't report embedding tokens separately
                
                # Alternative OpenAI format
                elif 'input_tokens' in metadata:
                    input_tokens = metadata.get('input_tokens', 0)
                    output_tokens = metadata.get('output_tokens', 0)
                    embedding_tokens = metadata.get('embedding_tokens', 0)
        
        # Try to get usage from raw response if available
        if input_tokens == 0 and output_tokens == 0:
            if hasattr(response, 'usage_metadata'):
                usage = response.usage_metadata
                input_tokens = getattr(usage, 'prompt_token_count', 0)
                output_tokens = getattr(usage, 'candidates_token_count', 0)
            
            elif hasattr(response, 'token_usage'):
                usage = response.token_usage
                input_tokens = getattr(usage, 'prompt_tokens', 0) or getattr(usage, 'input_tokens', 0)
                output_tokens = getattr(usage, 'completion_tokens', 0) or getattr(usage, 'output_tokens', 0)
                embedding_tokens = getattr(usage, 'embedding_tokens', 0)
    
    except Exception as e:
        # If extraction fails, return zeros (will use fallback estimation)
        pass
    
    return input_tokens, output_tokens, embedding_tokens


def estimate_tokens(text: str) -> int:
    """
    Estimate token count from text (fallback when actual usage unavailable).
    Uses a simple approximation: ~1 token per 4 characters or ~0.75 tokens per word.
    
    Args:
        text: Text to estimate tokens for
        
    Returns:
        Estimated token count
    """
    if not text:
        return 0
    
    # Use word-based estimation (more accurate for English text)
    word_count = len(text.split())
    # Average: ~1.33 tokens per word for English
    return int(word_count * 1.33)


def suppress_mcp_cleanup_errors(loop, context):
    """
    Suppress expected RuntimeError exceptions from MCP client cleanup.
    These occur when background tasks try to exit cancel scopes in different tasks.
    """
    exception = context.get('exception')
    if exception and isinstance(exception, RuntimeError):
        error_msg = str(exception).lower()
        # Suppress expected cancel scope errors from MCP cleanup
        if "cancel scope" in error_msg and "different task" in error_msg:
            # These are expected during MCP client cleanup - suppress them silently
            # The MCP library creates background tasks that can't properly exit
            # cancel scopes when cleanup happens in a different task context
            return
    
    # For all other exceptions, use the default handler
    loop.default_exception_handler(context)

