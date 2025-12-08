# API Key Configuration Changes

## Summary

The system has been updated to ensure proper separation of API keys:
- **OPENAI_API_KEY**: Used ONLY for embeddings (RAG system)
- **DEEPSEEK_KEY**: Used for agent and RAG responses (default LLM provider)

## Changes Made

### Backend Changes

1. **`backend/src/services/llm_factory.py`**
   - Added DeepSeek support as a new LLM type
   - Changed default LLM type from "openai" to "deepseek"
   - Changed default model from "gpt-4o" to "deepseek-chat"
   - Updated OpenAI handler to use `OPENAI_LLM_API_KEY` instead of `OPENAI_API_KEY`
   - Added DeepSeek handler that uses `DEEPSEEK_KEY` environment variable
   - Updated error messages to clarify that `OPENAI_API_KEY` is only for embeddings

2. **`backend/src/core/config.py`**
   - Updated `load_llm_config()` to use DeepSeek as default fallback
   - Changed default config from OpenAI GPT to DeepSeek
   - Updated API key loading logic to use `DEEPSEEK_KEY` for DeepSeek
   - Removed fallback to `OPENAI_API_KEY` for OpenAI LLM (now uses `OPENAI_LLM_API_KEY`)

3. **`backend/src/api/lifespan.py`**
   - Updated primary LLM model initialization from OpenAI GPT to DeepSeek
   - Changed default model creation to use DeepSeek with `DEEPSEEK_KEY`
   - Updated all related messages and comments

4. **`backend/src/api/models.py`**
   - Added "deepseek" to LLMConfigRequest type literal

5. **`backend/src/api/routes/llm_config.py`**
   - Added DeepSeek support in LLM configuration endpoint
   - Updated reset endpoint to use DeepSeek instead of OpenAI
   - Changed default reset model to "deepseek-chat"

6. **`backend/src/core/env_validation.py`**
   - Updated `OPENAI_API_KEY` description to clarify it's only for embeddings
   - Added `DEEPSEEK_KEY` as a recommended environment variable

### Frontend Changes

1. **`frontend/types/api/llm.ts`**
   - Added "deepseek" to LLMConfig type union

2. **`frontend/components/SettingsPanel.tsx`**
   - Added "deepseek" to allowed LLM types
   - Updated validation to require API key for DeepSeek
   - Updated reset function to use DeepSeek defaults
   - Updated UI messages to reference DeepSeek instead of OpenAI

### Configuration Changes

1. **`docker-compose.yml`**
   - Added `DEEPSEEK_KEY` environment variable
   - Updated `OPENAI_API_KEY` comment to clarify it's only for embeddings

## Environment Variables

### Required
- `OPENAI_API_KEY`: Used ONLY for embeddings (RAG system)
- `DEEPSEEK_KEY`: Used for agent and RAG responses (default LLM provider)

### Optional
- `OPENAI_LLM_API_KEY`: If you want to use OpenAI for LLM responses (separate from embeddings)
- `GOOGLE_API_KEY`: For Gemini models
- `GROQ_API_KEY`: For Groq models

## Migration Notes

1. **Existing Deployments**: 
   - Set `DEEPSEEK_KEY` environment variable
   - Keep `OPENAI_API_KEY` for embeddings
   - The system will automatically create DeepSeek as the default LLM on next startup

2. **Database**: 
   - Existing OpenAI configs will remain but DeepSeek will be set as active
   - Users can still switch to OpenAI if they configure `OPENAI_LLM_API_KEY`

3. **Frontend**: 
   - Settings panel now shows DeepSeek as default
   - Users can select DeepSeek from the LLM type dropdown

## Testing

After deploying these changes:
1. Verify embeddings still work (uses `OPENAI_API_KEY`)
2. Verify agent mode uses DeepSeek (uses `DEEPSEEK_KEY`)
3. Verify RAG mode uses DeepSeek (uses `DEEPSEEK_KEY`)
4. Verify users can still switch to other LLM providers via settings

## API Endpoints

- `GET /api/llm-config`: Returns current LLM config (now defaults to DeepSeek)
- `POST /api/llm-config`: Set LLM config (supports DeepSeek)
- `POST /api/llm-config/reset`: Reset to DeepSeek defaults

