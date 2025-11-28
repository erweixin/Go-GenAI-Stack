#!/bin/bash
# ============================================
# Go-GenAI-Stack 生产环境启动脚本
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

echo -e "${BLUE}🚀 Starting Go-GenAI-Stack Production Environment...${NC}"
echo ""

# ============================================
# 1. 环境检查
# ============================================
echo -e "${BLUE}📋 Step 1/6: Environment Check${NC}"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed${NC}"
    exit 1
fi

# 检查 Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose V2 is not installed${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
    echo -e "${YELLOW}   正在从 env.example 创建...${NC}"
    cp env.example .env
    echo ""
    echo -e "${RED}❌ 请编辑 .env 文件并设置必需的密码（共 4 个）${NC}"
    echo ""
    echo -e "${BLUE}📝 必需配置:${NC}"
    echo "   - POSTGRES_PASSWORD"
    echo "   - REDIS_PASSWORD"
    echo "   - APP_JWT_SECRET"
    echo "   - GRAFANA_PASSWORD"
    echo ""
    echo -e "${YELLOW}💡 生成安全密钥:${NC}"
    echo "   openssl rand -base64 32  # 用于 APP_JWT_SECRET"
    echo "   openssl rand -base64 24  # 用于密码"
    echo ""
    echo -e "${YELLOW}💡 配置完成后运行验证:${NC}"
    echo "   ./validate-config.sh"
    exit 1
fi

# 运行配置验证脚本
if [ -f "./validate-config.sh" ]; then
    echo -e "${BLUE}正在运行配置验证...${NC}"
    if ! ./validate-config.sh; then
        exit 1
    fi
else
    # 如果验证脚本不存在，执行基础检查
    source .env
    REQUIRED_VARS=(
        "POSTGRES_PASSWORD:数据库密码"
        "REDIS_PASSWORD:Redis 密码"
        "APP_JWT_SECRET:JWT 密钥"
        "GRAFANA_PASSWORD:Grafana 密码"
    )

    MISSING_VARS=()
    for item in "${REQUIRED_VARS[@]}"; do
        var="${item%%:*}"
        if [ -z "${!var}" ] || [[ "${!var}" == CHANGE_ME* ]]; then
            MISSING_VARS+=("$item")
        fi
    done

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${RED}❌ 错误: 以下必需配置未设置或仍使用默认值:${NC}"
        for item in "${MISSING_VARS[@]}"; do
            desc="${item##*:}"
            echo -e "${RED}   - $desc${NC}"
        done
        echo ""
        echo -e "${YELLOW}💡 生成安全密钥:${NC}"
        echo "   openssl rand -base64 32  # 用于 APP_JWT_SECRET"
        echo "   openssl rand -base64 24  # 用于密码"
        echo ""
        echo -e "${YELLOW}   请编辑 .env 并设置正确的值${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 基础配置检查通过${NC}"
fi

echo ""

# ============================================
# 2. 检查是否已经运行
# ============================================
echo -e "${BLUE}📋 Step 2/6: Check if services are running${NC}"

if docker ps | grep -q "go-genai-stack.*-prod"; then
    echo -e "${YELLOW}⚠️  Production environment is already running${NC}"
    echo ""
    docker compose ps
    echo ""
    echo "To restart, run: ./stop.sh && ./start.sh"
    exit 0
fi

echo -e "${GREEN}✓ No running services found${NC}"
echo ""

# ============================================
# 3. 拉取最新镜像
# ============================================
echo -e "${BLUE}📋 Step 3/6: Pull latest images${NC}"
docker compose pull
echo -e "${GREEN}✓ Images pulled${NC}"
echo ""

# ============================================
# 4. 构建后端镜像
# ============================================
echo -e "${BLUE}📋 Step 4/6: Build backend image${NC}"
docker compose build --no-cache backend
echo -e "${GREEN}✓ Backend image built${NC}"
echo ""

# ============================================
# 5. 启动服务
# ============================================
echo -e "${BLUE}📋 Step 5/6: Starting services${NC}"
docker compose up -d

echo -e "${GREEN}✓ Services started${NC}"
echo ""

# ============================================
# 6. 等待服务健康检查
# ============================================
echo -e "${BLUE}📋 Step 6/6: Waiting for services to be healthy...${NC}"

# 等待 PostgreSQL
echo -n "  - PostgreSQL: "
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-postgres-prod 2>/dev/null || echo "starting")
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
    echo "PostgreSQL failed to start. Check logs:"
    docker compose logs postgres
    exit 1
fi

# 等待 Redis
echo -n "  - Redis:      "
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-redis-prod 2>/dev/null || echo "starting")
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
    docker compose logs redis
    exit 1
fi

# 等待 Backend
echo -n "  - Backend:    "
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' go-genai-stack-backend-prod 2>/dev/null || echo "starting")
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
    docker compose logs backend
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All services are healthy!${NC}"
echo ""

# ============================================
# 显示服务信息
# ============================================
echo -e "${BLUE}📊 Service Status:${NC}"
docker compose ps
echo ""

echo -e "${BLUE}🌐 Service URLs:${NC}"
echo -e "  Backend API:    http://localhost:${APP_PORT:-8080}"
echo -e "  Grafana:        http://localhost:${GRAFANA_PORT:-3000}"
echo -e "  Prometheus:     http://localhost:${PROMETHEUS_PORT:-9090}"
echo -e "  Jaeger UI:      http://localhost:${JAEGER_UI_PORT:-16686}"
echo ""

echo -e "${BLUE}📋 Useful Commands:${NC}"
echo -e "  View logs:      docker compose logs -f"
echo -e "  Stop services:  ./stop.sh"
echo -e "  Restart:        ./stop.sh && ./start.sh"
echo -e "  Service status: docker compose ps"
echo ""

echo -e "${GREEN}✅ Production environment is ready!${NC}"

