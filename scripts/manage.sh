#!/bin/bash
set -e

# Default variables
COMMAND=$1

# Colors for log monitoring
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

case "$COMMAND" in
    setup)
        echo -e "${GREEN}Running setup...${NC}"
        mkdir -p temp_files
        docker pull python:3.11-alpine
        docker pull node:20-alpine
        docker pull redis:alpine
        echo -e "${GREEN}Setup complete.${NC}"
        ;;
    build)
        echo -e "${GREEN}Building images...${NC}"
        COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
        echo "Tagging with $COMMIT"
        docker build -t polyglot-runner-python:$COMMIT -t polyglot-runner-python:latest -f containers/python/Dockerfile .
        docker build -t polyglot-runner-nodejs:$COMMIT -t polyglot-runner-nodejs:latest -f containers/nodejs/Dockerfile .
        docker build -t polyglot-api:$COMMIT -t polyglot-api:latest -f containers/api/Dockerfile .
        echo -e "${GREEN}Build complete.${NC}"
        ;;
    test)
        echo -e "${GREEN}Running integration tests...${NC}"
        # Ensure temp_files exists
        mkdir -p temp_files
        
        # Start services
        docker-compose up -d
        
        # Wait for services to be ready
        echo "Waiting for API to be ready..."
        sleep 10
        
        echo -e "\nTesting Python Runner..."
        PYTHON_RES=$(curl -s -X POST http://localhost:3000/execute \
             -H "Content-Type: application/json" \
             -d '{"language": "python", "code": "print(\"Hello World from Python!\")"}')
        echo "$PYTHON_RES"
        if echo "$PYTHON_RES" | grep -q "Hello World from Python!"; then
             echo -e "${GREEN}Python test passed${NC}"
        else
             echo -e "${RED}Python test failed${NC}"
        fi
             
        echo -e "\nTesting Node.js Runner..."
        NODE_RES=$(curl -s -X POST http://localhost:3000/execute \
             -H "Content-Type: application/json" \
             -d '{"language": "nodejs", "code": "console.log(\"Hello World from Node!\")"}')
        echo "$NODE_RES"
        if echo "$NODE_RES" | grep -q "Hello World from Node!"; then
             echo -e "${GREEN}Node.js test passed${NC}"
        else
             echo -e "${RED}Node.js test failed${NC}"
        fi
             
        echo -e "\n${GREEN}Tests complete.${NC}"
        ;;
    clean)
        echo -e "${GREEN}Cleaning up...${NC}"
        docker-compose down -v || true
        rm -rf temp_files
        echo -e "${GREEN}Cleanup complete.${NC}"
        ;;
    logs)
        echo -e "${GREEN}Starting log monitor...${NC}"
        docker-compose logs -f | awk '
            /ERROR|CRITICAL/ { print "\033[0;31m" $0 "\033[0m"; next }
            { print $0 }
        '
        ;;
    *)
        echo "Usage: $0 {setup|build|test|clean|logs}"
        exit 1
esac
