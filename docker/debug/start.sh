#!/bin/bash
# 启动前端调试环境
# 用途：启动后端和数据库，供前端开发使用

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

echo -e "${BLUE}🚀 Starting Frontend Debug Environment...${NC}"
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

# 检查是否已经运行（检查 Debug 特定容器）
if docker ps --filter "name=postgres-debug" --filter "status=running" | grep -q "postgres-debug"; then
    echo -e "${YELLOW}⚠️  Debug environment is already running${NC}"
    echo ""
    $DOCKER_COMPOSE ps
    echo ""
    echo "To restart, run: ./docker/debug/stop.sh && ./docker/debug/start.sh"
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
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-postgres-debug 2>/dev/null || echo "starting")
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
    $DOCKER_COMPOSE logs postgres-debug
    exit 1
fi

# 等待 Backend
echo -n "  - Backend:  "
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-backend-debug 2>/dev/null || echo "starting")
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
    $DOCKER_COMPOSE logs backend-debug
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Debug environment is ready!${NC}"
echo ""
echo -e "${BLUE}📡 Service Information:${NC}"
echo "  - Backend API:    http://localhost:8082"
echo "  - Health Check:   http://localhost:8082/health"
echo "  - PostgreSQL:     localhost:5434"
echo ""
echo -e "${BLUE}👤 Test Account:${NC}"
echo "  - Email:    debug@example.com"
echo "  - Password: Debug123456!"
echo ""
echo -e "${BLUE}🛠️  Frontend Development:${NC}"
echo "  1. Set VITE_API_BASE_URL=http://localhost:8082 in frontend/web/.env"
echo "  2. Run: cd frontend/web && pnpm dev"
echo ""
echo -e "${BLUE}📊 View Logs:${NC}"
echo "  docker compose -f docker/debug/docker-compose.yml logs -f"
echo ""
echo -e "${BLUE}🛑 Stop Environment:${NC}"
echo "  ./docker/debug/stop.sh"
echo ""

