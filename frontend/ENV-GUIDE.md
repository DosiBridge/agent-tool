# Frontend Environment Variables Guide

This guide explains how to load and use environment variables in the Next.js frontend.

## How Environment Variables Work in Next.js

### 1. **Build-time Variables (`NEXT_PUBLIC_*`)**
- Variables prefixed with `NEXT_PUBLIC_` are embedded into the JavaScript bundle at build time
- Available in both browser and server-side code
- **Important**: These are public and visible in the browser, so don't put secrets here

### 2. **Server-side Variables (without `NEXT_PUBLIC_`)**
- Only available in API routes and server components
- Not accessible in client-side code
- Use these for sensitive data like API keys

### 3. **Runtime Configuration**
- The app uses a runtime config API route (`/api/runtime-config`) to load configuration at runtime
- This allows changing the API URL without rebuilding the Docker image

## Setup Methods

### Method 1: Local Development (`.env.local`)

1. **Create `.env.local` file** in the `frontend/` directory:
   ```bash
   cd frontend
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** with your values:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8085
   ```

3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

### Method 2: Production Build (`.env.production`)

1. **Create `.env.production` file**:
   ```bash
   cd frontend
   cp .env.production.example .env.production
   ```

2. **Edit `.env.production`**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://agentapi.dosibridge.com
   ```

3. **Build the app**:
   ```bash
   npm run build
   ```

### Method 3: Docker Compose (Runtime)

In `docker-compose.yml`, set environment variables:

```yaml
agent-frontend:
  environment:
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:8085"
```

The runtime config API route will read these at container startup.

### Method 4: Docker Build Arguments

When building the Docker image:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  -t my-frontend .
```

## How the Runtime Config Works

The frontend uses a two-step approach for configuration:

1. **API Route** (`/app/api/runtime-config/route.ts`):
   - Reads from `process.env.NEXT_PUBLIC_API_BASE_URL` or `process.env.API_BASE_URL`
   - Returns JSON config to the client
   - This runs on the server, so it can read any environment variable

2. **Client-side Loader** (`/lib/api.ts`):
   - Fetches config from `/api/runtime-config` on first API call
   - Falls back to build-time `NEXT_PUBLIC_API_BASE_URL` if API route fails
   - Caches the config for subsequent requests

## Adding New Environment Variables

### For Client-side Access (Browser)

1. **Add to `.env.local.example` and `.env.production.example`**:
   ```env
   NEXT_PUBLIC_MY_VAR=value
   ```

2. **Update the runtime config API route** (`/app/api/runtime-config/route.ts`):
   ```typescript
   export async function GET() {
     const config = {
       API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8085',
       MY_VAR: process.env.NEXT_PUBLIC_MY_VAR, // Add your new variable
     };
     return Response.json(config);
   }
   ```

3. **Update the config loader** (`/lib/api.ts`):
   ```typescript
   let runtimeConfig: { 
     API_BASE_URL?: string;
     MY_VAR?: string; // Add your new variable
   } | null = null;
   ```

4. **Use in your code**:
   ```typescript
   const myVar = runtimeConfig?.MY_VAR || process.env.NEXT_PUBLIC_MY_VAR;
   ```

### For Server-side Only (API Routes)

1. **Add to `.env.local` or `.env.production`** (no `NEXT_PUBLIC_` prefix):
   ```env
   SECRET_API_KEY=my-secret-key
   ```

2. **Use in API routes or server components**:
   ```typescript
   // In /app/api/some-route/route.ts
   const secretKey = process.env.SECRET_API_KEY;
   ```

## Environment Variable Priority

When the app loads, it checks in this order:

1. **Runtime Config API** (`/api/runtime-config`) - reads from container environment
2. **Build-time `NEXT_PUBLIC_*`** - embedded at build time
3. **Default fallback** - hardcoded defaults in code

## Troubleshooting

### Variable not loading?

1. **Check the prefix**: Client-side variables must have `NEXT_PUBLIC_` prefix
2. **Restart dev server**: After changing `.env.local`, restart with `npm run dev`
3. **Rebuild**: For production, rebuild with `npm run build`
4. **Check Docker**: For Docker, ensure env vars are set in `docker-compose.yml` or passed at runtime

### Runtime config not working?

1. **Check API route**: Visit `http://localhost:3000/api/runtime-config` to see if it returns config
2. **Check browser console**: Look for "Using runtime API URL" or "Using fallback API URL" messages
3. **Check environment**: Ensure `NEXT_PUBLIC_API_BASE_URL` is set in the container

## Example Files

- `.env.local.example` - Template for local development
- `.env.production.example` - Template for production builds

**Note**: `.env.local` and `.env.production` are gitignored and should not be committed.

