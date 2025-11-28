#!/bin/bash
# 启动后端调试环境（仅数据库）
# 用途：启动数据库，供后端本地开发使用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🚀 Starting Backend Debug Environment (Database Only)...${NC}"
echo ""

# 检测 Docker Compose 命令（兼容新旧版本）
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# 检查是否已经运行（检查 Backend Debug 特定容器）
if docker ps --filter "name=postgres-backend-debug" --filter "status=running" | grep -q "postgres-backend-debug"; then
    echo -e "${YELLOW}⚠️  Backend Debug environment is already running${NC}"
    echo ""
    $DOCKER_COMPOSE ps
    echo ""
    echo "To restart, run: ./docker/backend-debug/stop.sh && ./docker/backend-debug/start.sh"
    exit 0
fi

# 启动 Docker Compose
echo -e "${BLUE}📦 Building and starting Docker containers...${NC}"
$DOCKER_COMPOSE build
$DOCKER_COMPOSE up -d

# 等待服务健康检查
echo ""
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"

# 等待 Postgres
echo -n "  - Postgres: "
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-postgres-backend-debug 2>/dev/null || echo "starting")
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        echo -e "${GREEN}✓ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo -e "${RED}✗ Timeout${NC}"
    echo "Postgres failed to start. Check logs:"
    $DOCKER_COMPOSE logs postgres-backend-debug
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Backend Debug Environment is Ready!${NC}"
echo ""
echo -e "${BLUE}📋 Service Information:${NC}"
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Service   │ Connection                      │"
echo "  ├───────────┼─────────────────────────────────┤"
echo "  │ Postgres  │ localhost:5435                  │"
echo "  │ Database  │ go_genai_stack_backend_debug    │"
echo "  │ User      │ postgres                        │"
echo "  │ Password  │ postgres                        │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo -e "${BLUE}👤 Test User Credentials:${NC}"
echo "  Email:    backend-debug@example.com"
echo "  Password: Backend123456!"
echo ""
echo -e "${BLUE}🔧 Run Backend Locally:${NC}"
echo "  cd backend"
echo "  export APP_DATABASE_HOST=localhost"
echo "  export APP_DATABASE_PORT=5435"
echo "  export APP_DATABASE_USER=postgres"
echo "  export APP_DATABASE_PASSWORD=postgres"
echo "  export APP_DATABASE_DATABASE=go_genai_stack_backend_debug"
echo "  export APP_DATABASE_SSL_MODE=disable"
echo "  go run cmd/server/main.go"
echo ""
echo -e "${BLUE}📊 View Logs:${NC}"
echo "  docker compose -f docker/backend-debug/docker-compose.yml logs -f"
echo ""
echo -e "${BLUE}🛑 Stop Environment:${NC}"
echo "  ./docker/backend-debug/stop.sh"
echo ""

