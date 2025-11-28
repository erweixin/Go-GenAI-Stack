#!/bin/bash
# ============================================
# Go-GenAI-Stack 生产环境停止脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 解析参数
CLEAN_VOLUMES=false
if [ "$1" == "--clean" ] || [ "$1" == "-c" ]; then
    CLEAN_VOLUMES=true
fi

echo -e "${BLUE}🛑 Stopping Go-GenAI-Stack Production Environment...${NC}"
echo ""

# 检查是否在运行
if ! docker ps | grep -q "go-genai-stack.*-prod"; then
    echo -e "${YELLOW}⚠️  Production environment is not running${NC}"
    if [ "$CLEAN_VOLUMES" = true ]; then
        echo -e "${YELLOW}Cleaning up volumes anyway...${NC}"
        docker compose down -v
        echo -e "${GREEN}✅ Volumes cleaned${NC}"
    fi
    exit 0
fi

# 停止服务
if [ "$CLEAN_VOLUMES" = true ]; then
    echo -e "${YELLOW}🧹 Stopping and cleaning up (including volumes)...${NC}"
    echo -e "${RED}⚠️  WARNING: This will DELETE all data (database, logs, metrics)!${NC}"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${BLUE}Cancelled${NC}"
        exit 0
    fi
    
    docker compose down -v
    echo ""
    echo -e "${GREEN}✅ Production environment stopped and cleaned${NC}"
    echo -e "${BLUE}ℹ️  All data has been removed${NC}"
else
    echo -e "${BLUE}📦 Stopping containers (keeping volumes)...${NC}"
    docker compose down
    echo ""
    echo -e "${GREEN}✅ Production environment stopped${NC}"
    echo -e "${BLUE}ℹ️  Data volumes preserved${NC}"
    echo ""
    echo "To also remove data volumes, run:"
    echo "  ./stop.sh --clean"
fi

echo ""
echo -e "${BLUE}📋 Remaining volumes:${NC}"
docker volume ls | grep "go-genai-stack.*-prod" || echo "  (none)"

