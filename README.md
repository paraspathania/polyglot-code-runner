# The OmniCode Sandbox Automator

[![CI / CD](https://github.com/paraspathania/polyglot-code-runner/actions/workflows/ci.yml/badge.svg)](https://github.com/paraspathania/polyglot-code-runner/actions/workflows/ci.yml)

**A containerized, automated code-execution platform** (simplified LeetCode/Replit backend).

## Features

- **TypeScript REST API** (`POST /execute`) that writes code to a temp file and executes it inside isolated Docker runners.
- **Secure Runners**: Python & Node.js runners running as non-root users with strict resource limits.
- **Redis Cache**: Caching execution results based on content hash.
- **Automation**: Full lifecycle automation via `scripts/manage.sh`.
- **Orchestration**: Docker Compose orchestration for API and Redis services.

## Project Structure

```text
/src                # TypeScript Runner API source code
/scripts            # manage.sh (automation CLI script)
/containers
├── api/            # Dockerfile for the API service
├── python/         # Dockerfile for the Python runner
└── nodejs/         # Dockerfile for the Node.js runner
docker-compose.yml  # API + Redis orchestration
```

## Quick Start

The provided `manage.sh` script automates the full lifecycle of the environment.

### Using the Web Application (New!)
Just navigate to [http://localhost:3000](http://localhost:3000) in your browser!
The application comes with a fully-featured, glassmorphic code editor right in your browser. Select your language, write your code, and hit "Run".

```bash
# 1. Verify Docker/Git, create temp directories, and pull base images
bash scripts/manage.sh setup

# 2. Build and tag runner + API images with the current Git commit
bash scripts/manage.sh build

# 3. Start services and run Hello World integration tests
bash scripts/manage.sh test

# 4. View real-time logs (highlights ERROR/CRITICAL in red)
bash scripts/manage.sh logs

# 5. Clean up containers, networks, and temp files
bash scripts/manage.sh clean
```

## API Usage (`POST /execute`)

You can execute code by sending a JSON payload to `http://localhost:3000/execute`.

**Python Example:**
```bash
curl -X POST http://localhost:3000/execute \
     -H "Content-Type: application/json" \
     -d '{"language": "python", "code": "print(\"Hello OmniCode!\")"}'
```

**Node.js Example:**
```bash
curl -X POST http://localhost:3000/execute \
     -H "Content-Type: application/json" \
     -d '{"language": "nodejs", "code": "console.log(\"Hello OmniCode!\")"}'
```

**Response Format:**
```json
{
  "source": "execution",
  "stdout": "Hello OmniCode!\n",
  "stderr": "",
  "error": null
}
```

### Docker Hub Images

| Image | Pull command |
|---|---|
| API server | `docker pull paraspathania/polyglot-api:latest` |
| Python runner | `docker pull paraspathania/polyglot-runner-python:latest` |
| Node.js runner | `docker pull paraspathania/polyglot-runner-nodejs:latest` |
| C runner | `docker pull paraspathania/polyglot-runner-c:latest` |
| C++ runner | `docker pull paraspathania/polyglot-runner-cpp:latest` |
| Java runner | `docker pull paraspathania/polyglot-runner-java:latest` |

Direct links: [polyglot-api](https://hub.docker.com/r/paraspathania/polyglot-api) · [polyglot-runner-python](https://hub.docker.com/r/paraspathania/polyglot-runner-python) · [polyglot-runner-nodejs](https://hub.docker.com/r/paraspathania/polyglot-runner-nodejs) · [polyglot-runner-c](https://hub.docker.com/r/paraspathania/polyglot-runner-c) · [polyglot-runner-cpp](https://hub.docker.com/r/paraspathania/polyglot-runner-cpp) · [polyglot-runner-java](https://hub.docker.com/r/paraspathania/polyglot-runner-java)

## CI / CD

Every push to `main` runs the GitHub Actions workflow (`.github/workflows/ci.yml`) and the Jenkins pipeline (`Jenkinsfile`):

1. **Build TypeScript** — `npm ci && npm run build` inside `src/`
2. **Build Docker images** — all six images built in parallel from their respective `containers/*/Dockerfile`
3. **Push to Docker Hub** — both `:latest` and `:<short-sha>` tags pushed (push events to `main` only)

### Required Secrets / Credentials

| Platform | Secret name | Value |
|---|---|---|
| GitHub Actions | `DOCKERHUB_USERNAME` | Your Docker Hub username |
| GitHub Actions | `DOCKERHUB_TOKEN` | Docker Hub access token |
| Jenkins | `dockerhub-credentials` | Username + password credential |

## Security Best Practices

This sandbox applies multiple security barriers to safely run untrusted code:
- **Non-Root Execution**: Both Python and Node.js runners use a restricted `runner` user created in their respective `Dockerfile`s.
- **Ephemeral Containers**: A new, disposable container is spun up for every single code execution (`--rm`).
- **Resource Limits**: Strict constraints prevent fork-bombs and memory leaks (`--memory=256m --cpus="0.5"`).
- **Network Isolation**: Runners execute in an offline environment (`--network none`) to prevent outward communication.
- **Read-Only Volumes**: Code scripts are mounted with `ro` (read-only) permissions.
- **Temporary File Cleanup**: Code artifacts are wiped immediately after execution to prevent accumulation.
