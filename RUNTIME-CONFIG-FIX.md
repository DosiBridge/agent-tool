# Runtime Config Fix - Frontend API URL

## Problem
The frontend was hardcoded to use `https://agentapi.dosibridge.com` because `NEXT_PUBLIC_*` environment variables are embedded at build time, not runtime.

## Solution
Implemented runtime configuration that reads the API URL from environment variables at container startup.

## How to Rebuild and Deploy

### 1. Rebuild the Frontend Image

Since you're using a pre-built image, you need to rebuild it locally:

```bash
cd /home/jack/DosiBridge/agent-dosibridge

# Build the frontend image with the new runtime config support
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8085 \
  -f frontend/Dockerfile \
  -t dosibirdge/agent-frontend:latest \
  frontend/
```

### 2. Update docker-compose.yml (if needed)

Make sure your `docker-compose.yml` has:
```yaml
agent-frontend:
  environment:
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:8085"
```

### 3. Start the Containers

```bash
docker-compose up -d
```

### 4. Verify the Config File is Generated

Check the frontend logs to see if the config was generated:
```bash
docker-compose logs agent-frontend | grep -i "runtime config"
```

You should see:
```
✓ Runtime config generated: /app/public/runtime-config.json
✓ API_BASE_URL: http://localhost:8085
```

### 5. Test the API URL

Open your browser's developer console and check:
- The console should show: "Using runtime API URL: http://localhost:8085"
- API calls should go to `http://localhost:8085/api/...` not `localhost:8086`

## How It Works

1. **Container Startup**: The startup script runs `generate-runtime-config.js`
2. **Config Generation**: Script reads `NEXT_PUBLIC_API_BASE_URL` from environment and writes `public/runtime-config.json`
3. **Frontend Load**: On first API call, the frontend fetches `/runtime-config.json`
4. **API Calls**: All subsequent API calls use the runtime-configured URL

## Troubleshooting

### If API calls still go to wrong URL:

1. **Check container logs**:
   ```bash
   docker-compose logs agent-frontend
   ```

2. **Verify config file exists**:
   ```bash
   docker-compose exec agent-frontend cat /app/public/runtime-config.json
   ```

3. **Check browser console** for:
   - "Using runtime API URL: ..." (success)
   - "Runtime config file not found" (config file issue)
   - "Failed to load runtime config" (network/permission issue)

4. **Verify environment variable**:
   ```bash
   docker-compose exec agent-frontend env | grep NEXT_PUBLIC_API_BASE_URL
   ```

### If config file isn't generated:

- Check that the script has execute permissions
- Verify the public directory is writable
- Check container logs for errors during startup

