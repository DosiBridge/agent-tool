"""
LLM Configuration Management Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import os
from src.core import Config, get_db, LLMConfig
from src.services import create_llm_from_config
from ..models import LLMConfigRequest

router = APIRouter()


@router.get("/llm-config")
async def get_llm_config(db: Session = Depends(get_db)):
    """Get current LLM configuration"""
    try:
        config = Config.load_llm_config(db=db)
        # Don't send API key in response for security
        safe_config = {k: v for k, v in config.items() if k != "api_key" or not v}
        # Include has_api_key in the config object for frontend compatibility
        safe_config["has_api_key"] = bool(config.get("api_key"))
        return {
            "status": "success",
            "config": safe_config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/llm-config")
async def set_llm_config(config: LLMConfigRequest, db: Session = Depends(get_db)):
    """
    Set LLM configuration - allows switching to any model/LLM.
    The default OpenAI GPT (gpt-4o) config is preserved (deactivated) and can be restored via reset.
    """
    try:
        # Validate required fields based on type
        if config.type.lower() == "ollama":
            if not config.model:
                raise HTTPException(status_code=400, detail="Model name is required for Ollama")
            config_dict = {
                "type": "ollama",
                "model": config.model,
                "base_url": config.base_url or "http://localhost:11434",
                "active": True
            }
        elif config.type.lower() == "gemini":
            if not config.model:
                raise HTTPException(status_code=400, detail="Model name is required for Gemini")
            if not config.api_key:
                raise HTTPException(status_code=400, detail="API key is required for Gemini")
            config_dict = {
                "type": "gemini",
                "model": config.model,
                "api_key": config.api_key,
                "active": True
            }
        elif config.type.lower() == "groq":
            if not config.model:
                raise HTTPException(status_code=400, detail="Model name is required for Groq")
            if not config.api_key:
                raise HTTPException(status_code=400, detail="API key is required for Groq")
            config_dict = {
                "type": "groq",
                "model": config.model,
                "api_key": config.api_key,
                "active": True
            }
        elif config.type.lower() == "deepseek":
            if not config.model:
                raise HTTPException(status_code=400, detail="Model name is required for DeepSeek")
            if not config.api_key:
                raise HTTPException(status_code=400, detail="API key is required for DeepSeek")
            config_dict = {
                "type": "deepseek",
                "model": config.model,
                "api_key": config.api_key,
                "api_base": config.api_base or "https://api.deepseek.com",
                "active": True
            }
        else:  # OpenAI
            if not config.model:
                raise HTTPException(status_code=400, detail="Model name is required for OpenAI")
            if not config.api_key:
                raise HTTPException(status_code=400, detail="API key is required for OpenAI")
            config_dict = {
                "type": "openai",
                "model": config.model,
                "api_key": config.api_key,
                "active": True
            }
            if config.api_base:
                config_dict["api_base"] = config.api_base
        
        # Trim model name before saving
        if config_dict.get("model"):
            config_dict["model"] = config_dict["model"].strip()
        
        # Save configuration (will use database if available)
        try:
            if Config.save_llm_config(config_dict, db=db):
                # Commit the transaction if using database
                db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save LLM configuration: {str(e)}")
        
        # Test the configuration by creating an LLM instance
        try:
            test_llm = create_llm_from_config(config_dict, streaming=False, temperature=0)
            return {
                "status": "success",
                "message": f"LLM configuration saved and validated successfully. Model: {config_dict['model']}",
                "config": {
                    "type": config_dict["type"],
                    "model": config_dict["model"],
                    "has_api_key": bool(config_dict.get("api_key"))
                }
            }
        except ImportError as e:
            # Missing package - but still save the config
            error_msg = str(e)
            return {
                "status": "warning",
                "message": f"Configuration saved, but package is missing: {error_msg}",
                "config": {
                    "type": config_dict["type"],
                    "model": config_dict["model"],
                    "has_api_key": bool(config_dict.get("api_key"))
                }
            }
        except Exception as e:
            # Configuration saved but test failed
            error_msg = str(e)
            # Don't fail the save, but warn the user
            return {
                "status": "warning",
                "message": f"Configuration saved, but validation failed: {error_msg}",
                "config": {
                    "type": config_dict["type"],
                    "model": config_dict["model"],
                    "has_api_key": bool(config_dict.get("api_key"))
                }
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/llm-config/reset")
async def reset_llm_config(db: Session = Depends(get_db)):
    """
    Reset LLM configuration to default DeepSeek settings (deepseek-chat).
    This always restores the default config with API key from environment.
    Previous configs are preserved but deactivated.
    Note: OPENAI_API_KEY is only used for embeddings, not for LLM responses.
    """
    try:
        # Deactivate all existing configs (they are preserved, just not active)
        # This ensures the default DeepSeek config cannot be deleted
        db.query(LLMConfig).update({LLMConfig.active: False})
        
        # Check if default DeepSeek config already exists
        existing_default = db.query(LLMConfig).filter(
            LLMConfig.type == "deepseek",
            LLMConfig.model == "deepseek-chat"
        ).first()
        
        if existing_default:
            # Reactivate the existing default config and update API key from env
            deepseek_api_key = os.getenv("DEEPSEEK_KEY")
            existing_default.active = True
            if deepseek_api_key:
                existing_default.api_key = deepseek_api_key
            db.commit()
            db.refresh(existing_default)
            default_config = existing_default
        else:
            # Create new default DeepSeek config with API key from environment
            deepseek_api_key = os.getenv("DEEPSEEK_KEY")
            default_config = LLMConfig(
                type="deepseek",
                model="deepseek-chat",
                api_key=deepseek_api_key,  # Get from environment
                api_base="https://api.deepseek.com",
                active=True
            )
            db.add(default_config)
            db.commit()
            db.refresh(default_config)
        
        return {
            "status": "success",
            "message": "LLM configuration reset to default DeepSeek settings (deepseek-chat)",
            "config": default_config.to_dict()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset LLM configuration: {str(e)}")

