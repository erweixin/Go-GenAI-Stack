#!/bin/bash

# E2E 测试环境启动脚本
# 用途：启动 Postgres 和 Backend E2E 测试环境
# 使用：./docker/e2e/start.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🚀 Starting E2E Test Environment...${NC}"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# 检测 Docker Compose 命令（兼容新旧版本）
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 检查是否已经运行（检查 E2E 特定容器）
if docker ps --filter "name=postgres-e2e" --filter "status=running" | grep -q "postgres-e2e"; then
    echo -e "${YELLOW}⚠️  E2E environment is already running${NC}"
    echo ""
    $DOCKER_COMPOSE ps
    echo ""
    echo "To restart, run: ./docker/e2e/stop.sh && ./docker/e2e/start.sh"
    exit 0
fi

# 启动 Docker Compose
echo -e "${BLUE}📦 Starting Docker containers...${NC}"
$DOCKER_COMPOSE up -d

# 等待服务健康检查
echo ""
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"

# 等待 Postgres
echo -n "  - Postgres: "
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-postgres-e2e 2>/dev/null || echo "starting")
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
    $DOCKER_COMPOSE logs postgres-e2e
    exit 1
fi

# 等待 Backend
echo -n "  - Backend:  "
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-backend-e2e 2>/dev/null || echo "starting")
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
    echo "Backend failed to start. Check logs:"
    $DOCKER_COMPOSE logs backend-e2e
    exit 1
fi

echo ""
echo -e "${GREEN}✅ E2E Test Environment is Ready!${NC}"
echo ""
echo -e "${BLUE}📋 Service Information:${NC}"
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Service   │ URL / Connection                │"
echo "  ├───────────┼─────────────────────────────────┤"
echo "  │ Postgres  │ localhost:5433                  │"
echo "  │ Backend   │ http://localhost:8081           │"
echo "  │ Frontend  │ http://localhost:5173 (Host)    │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo -e "${BLUE}👤 Test User Credentials:${NC}"
echo "  Email:    e2e-test@example.com"
echo "  Password: Test123456!"
echo ""
echo -e "${BLUE}🧪 Run E2E Tests:${NC}"
echo "  cd frontend/web"
echo "  pnpm e2e              # Run all tests"
echo "  pnpm e2e:ui           # UI mode (recommended)"
echo ""
echo -e "${BLUE}📊 View Logs:${NC}"
echo "  docker compose -f docker/e2e/docker-compose.yml logs -f"
echo ""
echo -e "${BLUE}🛑 Stop Environment:${NC}"
echo "  ./docker/e2e/stop.sh"
echo ""

