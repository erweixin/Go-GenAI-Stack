#!/bin/bash

# E2E 测试环境停止脚本
# 用途：停止并清理 E2E 测试环境
# 使用：./docker/e2e/stop.sh [--clean]

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker"

# 检测 Docker Compose 命令（兼容新旧版本）
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# 检查参数
CLEAN_VOLUMES=false
if [ "$1" == "--clean" ]; then
    CLEAN_VOLUMES=true
fi

echo -e "${BLUE}🛑 Stopping E2E Test Environment...${NC}"
echo ""

# 进入 docker 目录
cd "$DOCKER_DIR"

# 检查是否在运行
if ! $DOCKER_COMPOSE -f docker-compose-e2e.yml ps | grep -q "Up"; then
    echo -e "${YELLOW}⚠️  E2E environment is not running${NC}"
    if [ "$CLEAN_VOLUMES" = true ]; then
        echo -e "${YELLOW}Cleaning up volumes anyway...${NC}"
        $DOCKER_COMPOSE -f docker-compose-e2e.yml down -v
        echo -e "${GREEN}✅ Volumes cleaned${NC}"
    fi
    exit 0
fi

# 停止服务
if [ "$CLEAN_VOLUMES" = true ]; then
    echo -e "${YELLOW}🧹 Stopping and cleaning up (including volumes)...${NC}"
    $DOCKER_COMPOSE -f docker-compose-e2e.yml down -v
    echo ""
    echo -e "${GREEN}✅ E2E environment stopped and cleaned${NC}"
    echo -e "${BLUE}ℹ️  All data has been removed${NC}"
else
    echo -e "${BLUE}📦 Stopping containers (keeping volumes)...${NC}"
    $DOCKER_COMPOSE -f docker-compose-e2e.yml down
    echo ""
    echo -e "${GREEN}✅ E2E environment stopped${NC}"
    echo -e "${BLUE}ℹ️  Data volumes preserved${NC}"
    echo ""
    echo "To also remove data volumes, run:"
    echo "  ./docker/e2e/stop.sh --clean"
fi

echo ""
echo -e "${BLUE}🔄 To restart:${NC}"
echo "  ./docker/e2e/start.sh"
echo ""

