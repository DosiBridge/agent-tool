"""
LLM Configuration Testing Service
"""
from langchain_core.messages import HumanMessage
from src.services.llm_factory import create_llm_from_config
import asyncio

async def test_llm_config(config_dict: dict) -> tuple[bool, str]:
    """
    Test LLM configuration by making a simple API call.
    
    Args:
        config_dict: LLM configuration dictionary
        
    Returns:
        Tuple of (success: bool, message: str)
        Note: Returns True for rate limit/quota errors since the API key is valid
    """
    try:
        # Create LLM instance
        llm = create_llm_from_config(config_dict, streaming=False, temperature=0)
        
        # Make a simple test call (very short prompt to minimize cost)
        test_message = HumanMessage(content="Hi")
        
        # Use async invoke if available, otherwise run sync invoke in executor
        if hasattr(llm, 'ainvoke'):
            response = await llm.ainvoke([test_message])
        else:
            # Run sync invoke in executor to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: llm.invoke([test_message]))
        
        # Check if we got a response
        if response and hasattr(response, 'content') and response.content:
            return True, "LLM configuration is valid and working"
        else:
            return False, "LLM responded but with empty content"
    except ImportError as e:
        return False, f"Missing required package: {str(e)}"
    except ValueError as e:
        # ValueError can be raised by llm_factory for quota errors
        error_msg = str(e).lower()
        rate_limit_indicators = [
            "rate limit",
            "quota exceeded",
            "429",
            "quota",
            "billing",
            "plan and billing",
            "resource_exhausted"
        ]
        
        # Check if it's a rate limit/quota error
        is_rate_limit_error = any(indicator in error_msg for indicator in rate_limit_indicators)
        
        if is_rate_limit_error:
            # For rate limit errors, return success with a warning message
            # The API key is valid, just the account has hit limits
            original_error = str(e)
            return True, f"API key appears valid but account has rate limit/quota issues: {original_error}. You can still save this configuration and use it later when limits reset."
        
        # For other ValueError, return failure
        return False, str(e)
    except Exception as e:
        error_msg = str(e).lower()
        
        # Check for rate limit or quota errors - these mean the API key is valid
        # but the account has exceeded limits. We should allow saving the config.
        rate_limit_indicators = [
            "rate limit",
            "quota exceeded",
            "429",
            "quota",
            "billing",
            "plan and billing",
            "resource_exhausted"
        ]
        
        # Check if it's a rate limit/quota error
        is_rate_limit_error = any(indicator in error_msg for indicator in rate_limit_indicators)
        
        if is_rate_limit_error:
            # For rate limit errors, return success with a warning message
            # The API key is valid, just the account has hit limits
            original_error = str(e)
            return True, f"API key appears valid but account has rate limit/quota issues: {original_error}. You can still save this configuration and use it later when limits reset."
        
        # For other errors, return failure with helpful messages
        if "API key" in error_msg or "authentication" in error_msg or "401" in error_msg or "403" in error_msg:
            return False, f"Invalid API key or authentication failed: {str(e)[:200]}"
        elif "not found" in error_msg or "NotFound" in error_msg or "404" in error_msg:
            # Model not available - provide helpful suggestions
            if "gemini" in error_msg.lower():
                return False, f"Gemini model not available: {str(e)[:300]}. Try using 'gemini-1.5-pro' or 'gemini-pro' instead."
            return False, f"Model not found or not available: {str(e)[:300]}"
        elif "model" in error_msg and ("invalid" in error_msg):
            return False, f"Invalid model name: {str(e)[:200]}"
        elif "connection" in error_msg or "timeout" in error_msg or "refused" in error_msg:
            return False, f"Connection error: {str(e)[:200]}"
        else:
            return False, f"Test failed: {str(e)[:200]}"
