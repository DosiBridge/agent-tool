# CORS Error Fix Guide

## Understanding the Error

The error you're seeing:
```
Access to fetch at 'https://agentapi.dosibridge.com/api/sessions' from origin 'http://160.191.163.85:8086' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This means:
1. **Frontend Origin**: `http://160.191.163.85:8086` (your frontend)
2. **Backend API**: `https://agentapi.dosibridge.com` (your backend)
3. **Problem**: The backend is not configured to allow requests from your frontend origin

## Solution

You need to add your frontend origin to the backend's `CORS_ORIGINS` environment variable.

### Option 1: Update Docker Compose (if using docker-compose)

Edit `docker-compose.yml` and update the `CORS_ORIGINS` environment variable:

```yaml
agent-backend:
  environment:
    CORS_ORIGINS: "http://160.191.163.85:8086,http://localhost:8086,http://127.0.0.1:8086"
```

Then restart the backend:
```bash
docker-compose restart agent-backend
```

### Option 2: Set Environment Variable Directly

If running the backend directly (not via docker-compose), set the environment variable:

```bash
export CORS_ORIGINS="http://160.191.163.85:8086,http://localhost:8086,http://127.0.0.1:8086"
```

Or in your `.env` file:
```
CORS_ORIGINS=http://160.191.163.85:8086,http://localhost:8086,http://127.0.0.1:8086
```

### Option 3: If Using a Reverse Proxy (Nginx/Apache)

If you're using a reverse proxy, you also need to configure CORS there. For Nginx:

```nginx
location / {
    add_header 'Access-Control-Allow-Origin' 'http://160.191.163.85:8086' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    proxy_pass http://localhost:8000;
}
```

## 502 Bad Gateway Error

The 502 error suggests the backend might be:
1. **Not running** - Check if the backend container/process is running
2. **Behind a reverse proxy** - The proxy can't reach the backend
3. **Wrong port** - The backend might be running on a different port

### Check Backend Status

```bash
# If using Docker
docker ps | grep agent-backend

# Check backend logs
docker logs agent-backend

# Test backend directly
curl https://agentapi.dosibridge.com/health
```

### If Backend is Behind Reverse Proxy

Make sure:
1. Backend is running and accessible
2. Reverse proxy is configured correctly
3. Backend port matches proxy configuration

## Complete Fix Steps

1. **Add frontend origin to CORS_ORIGINS**:
   ```bash
   # In docker-compose.yml or .env
   CORS_ORIGINS="http://160.191.163.85:8086,http://localhost:8086,http://127.0.0.1:8086"
   ```

2. **Restart backend**:
   ```bash
   docker-compose restart agent-backend
   # OR if running directly
   # Restart your backend process
   ```

3. **Verify backend is running**:
   ```bash
   curl https://agentapi.dosibridge.com/health
   ```

4. **Check CORS headers**:
   ```bash
   curl -H "Origin: http://160.191.163.85:8086" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://agentapi.dosibridge.com/api/sessions \
        -v
   ```
   
   You should see `Access-Control-Allow-Origin: http://160.191.163.85:8086` in the response.

## Important Notes

- **Exact Match Required**: The origin must match exactly (including protocol http/https and port)
- **Multiple Origins**: Separate multiple origins with commas
- **No Trailing Slash**: Don't include trailing slashes in origins
- **Credentials**: The backend uses `allow_credentials=True`, so origins must be specific (not `*`)

## Example CORS_ORIGINS for Production

```bash
# Single frontend
CORS_ORIGINS="https://app.dosibridge.com"

# Multiple frontends
CORS_ORIGINS="https://app.dosibridge.com,http://160.191.163.85:8086,http://localhost:8086"

# With development and production
CORS_ORIGINS="https://app.dosibridge.com,http://160.191.163.85:8086,http://localhost:8086,http://127.0.0.1:8086"
```

