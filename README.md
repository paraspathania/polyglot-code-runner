# The OmniCode Sandbox Automator

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

### Postman Collection
[Polyglot Sandbox API Postman Collection](https://www.postman.com/example/polyglot-sandbox) (Example Link)

### Docker Hub Images
- [polyglot-api on Docker Hub](https://hub.docker.com/r/example/polyglot-api) (Example Link)
- [polyglot-runner-python on Docker Hub](https://hub.docker.com/r/example/polyglot-runner-python) (Example Link)
- [polyglot-runner-nodejs on Docker Hub](https://hub.docker.com/r/example/polyglot-runner-nodejs) (Example Link)

## Security Best Practices

This sandbox applies multiple security barriers to safely run untrusted code:
- **Non-Root Execution**: Both Python and Node.js runners use a restricted `runner` user created in their respective `Dockerfile`s.
- **Ephemeral Containers**: A new, disposable container is spun up for every single code execution (`--rm`).
- **Resource Limits**: Strict constraints prevent fork-bombs and memory leaks (`--memory=256m --cpus="0.5"`).
- **Network Isolation**: Runners execute in an offline environment (`--network none`) to prevent outward communication.
- **Read-Only Volumes**: Code scripts are mounted with `ro` (read-only) permissions.
- **Temporary File Cleanup**: Code artifacts are wiped immediately after execution to prevent accumulation.
