# Environment Variables Setup for GitHub Actions

## Frontend Docker Build

The frontend Docker build uses environment variables from GitHub Secrets to configure the API URL.

### Required GitHub Secrets

Set these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

1. **DOCKER_USERNAME** - Your Docker Hub username
2. **DOCKER_PASSWORD** - Your Docker Hub password or access token
3. **NEXT_PUBLIC_API_BASE_URL** - The backend API URL (e.g., `https://agentapi.dosibridge.com`)

### How It Works

1. **Build Time**: The `NEXT_PUBLIC_API_BASE_URL` is passed as a build argument to set the default value
2. **Runtime**: The environment variable is available in the container and can be overridden via `docker-compose.yml` or container environment variables
3. **API Route**: The `/api/runtime-config` endpoint reads the environment variable at runtime and serves it to the frontend

### Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `NEXT_PUBLIC_API_BASE_URL`
   - Value: Your production API URL (e.g., `https://agentapi.dosibridge.com`)

### Environment-Specific Configuration

For different environments (staging, production), you can:

1. **Use GitHub Environments**: Create environments in GitHub and set secrets per environment
2. **Use Workflow Variables**: Set variables at the workflow level
3. **Override at Runtime**: Set `NEXT_PUBLIC_API_BASE_URL` in `docker-compose.yml` to override the build-time value

### Example: Using GitHub Environments

```yaml
jobs:
  docker:
    runs-on: ubuntu-latest
    environment: production  # Use GitHub environment
    steps:
      - name: Build Docker image
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.NEXT_PUBLIC_API_BASE_URL }}
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_API_BASE_URL="${{ secrets.NEXT_PUBLIC_API_BASE_URL }}" \
            ...
```

### Runtime Override

Even if the image is built with a production URL, you can override it at runtime:

```yaml
# docker-compose.yml
services:
  agent-frontend:
    environment:
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:8085"  # Overrides build-time value
```

The `/api/runtime-config` endpoint will return the runtime value, allowing the same image to work in different environments.

