#!/bin/bash

# E2E 测试环境启动脚本
# 用途：启动 Postgres 和 Backend E2E 测试环境
# 使用：./docker/e2e/start.sh [--no-cache]
#       --no-cache: 强制完全重新构建镜像（不使用缓存）

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否使用 --no-cache 参数
NO_CACHE_FLAG=""
if [ "$1" = "--no-cache" ]; then
    NO_CACHE_FLAG="--no-cache"
    echo -e "${YELLOW}⚠️  Using --no-cache flag (slower but ensures fresh build)${NC}"
fi

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

# 构建并启动 Docker Compose（确保使用最新代码）
echo -e "${BLUE}🔨 Building Docker images (with latest code)...${NC}"
if [ -n "$NO_CACHE_FLAG" ]; then
    $DOCKER_COMPOSE build $NO_CACHE_FLAG backend-e2e backend-nodejs-e2e
else
    $DOCKER_COMPOSE build --build-arg BUILDKIT_INLINE_CACHE=1 backend-e2e backend-nodejs-e2e
fi

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

# 等待 Redis
echo -n "  - Redis:    "
TIMEOUT=30
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-redis-e2e 2>/dev/null || echo "starting")
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
    echo "Redis failed to start. Check logs:"
    $DOCKER_COMPOSE logs redis-e2e
    exit 1
fi

# 等待 Go Backend
echo -n "  - Go Backend: "
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
    echo "Go Backend failed to start. Check logs:"
    $DOCKER_COMPOSE logs backend-e2e
    exit 1
fi

# 等待 Node.js Backend
echo -n "  - Node.js Backend: "
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-backend-nodejs-e2e 2>/dev/null || echo "starting")
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
    echo "Node.js Backend failed to start. Check logs:"
    $DOCKER_COMPOSE logs backend-nodejs-e2e
    exit 1
fi

echo ""
echo -e "${GREEN}✅ E2E Test Environment is Ready!${NC}"
echo ""
echo -e "${BLUE}📋 Service Information:${NC}"
echo "  ┌─────────────────────────────────────────────┐"
echo "  │ Service         │ URL / Connection          │"
echo "  ├─────────────────┼───────────────────────────┤"
echo "  │ Postgres        │ localhost:5433            │"
echo "  │ Redis           │ localhost:6381            │"
echo "  │ Go Backend      │ http://localhost:8081     │"
echo "  │ Node.js Backend │ http://localhost:8082     │"
echo "  │ Frontend        │ http://localhost:5173     │"
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

