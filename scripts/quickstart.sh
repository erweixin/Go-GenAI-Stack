#!/bin/bash

#================================================
# Go-GenAI-Stack 一键启动脚本
#================================================
# 功能：
# 1. 检查依赖（Go, Docker）
# 2. 启动数据库（Docker Compose）
# 3. 运行迁移和种子数据
# 4. 启动后端
# 5. 打印访问地址
#================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 辅助函数
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 打印欢迎信息
echo ""
echo "================================================"
echo "  🚀 Go-GenAI-Stack 一键启动脚本"
echo "================================================"
echo ""

# 步骤 1: 检查依赖
info "步骤 1/5: 检查依赖..."

# 检查 Go
if ! command -v go &> /dev/null; then
    error "Go 未安装，请先安装 Go 1.21+"
    exit 1
fi
GO_VERSION=$(go version | awk '{print $3}')
success "Go 已安装: $GO_VERSION"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    error "Docker 未安装，请先安装 Docker"
    exit 1
fi
success "Docker 已安装"

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose 未安装"
    exit 1
fi
success "Docker Compose 已安装"

# 检查 psql（可选）
if ! command -v psql &> /dev/null; then
    warning "psql 未安装（可选），种子数据需要手动加载"
    PSQL_AVAILABLE=false
else
    success "psql 已安装"
    PSQL_AVAILABLE=true
fi

echo ""

# 步骤 2: 启动数据库
info "步骤 2/5: 启动数据库（PostgreSQL + Redis）..."

cd "$(dirname "$0")/.."  # 切换到项目根目录
PROJECT_ROOT=$(pwd)

# 检查 docker-compose.yml 是否存在
if [ ! -f "docker/docker-compose.yml" ]; then
    error "docker/docker-compose.yml 不存在"
    exit 1
fi

# 启动 Docker 容器
cd docker
info "启动 Docker 容器..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# 等待数据库启动
info "等待数据库启动（最多 30 秒）..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec go-genai-stack-postgres pg_isready -U postgres > /dev/null 2>&1; then
        success "数据库已就绪"
        break
    fi
    
    echo -n "."
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "数据库启动超时"
    exit 1
fi

echo ""

# 步骤 3: 运行数据库迁移
info "步骤 3/5: 运行数据库迁移..."

cd "$PROJECT_ROOT/backend"

# 检查是否安装了 Atlas
if ! command -v atlas &> /dev/null; then
    warning "Atlas 未安装，跳过迁移步骤"
    warning "请手动运行: cd backend && ./scripts/schema.sh apply"
else
    info "应用数据库迁移..."
    ./scripts/schema.sh apply || {
        warning "迁移失败，请检查数据库连接"
    }
    success "数据库迁移完成"
fi

echo ""

# 步骤 4: 加载种子数据
info "步骤 4/5: 加载种子数据..."

if [ "$PSQL_AVAILABLE" = true ]; then
    SEED_FILE="$PROJECT_ROOT/backend/migrations/seed/01_initial_data.sql"
    
    if [ -f "$SEED_FILE" ]; then
        info "加载种子数据..."
        
        # 读取数据库配置（与 env.example 一致）
        DB_HOST=${APP_DATABASE_HOST:-${POSTGRES_HOST:-localhost}}
        DB_PORT=${APP_DATABASE_PORT:-${POSTGRES_PORT:-5432}}
        DB_USER=${APP_DATABASE_USER:-${POSTGRES_USER:-genai}}
        DB_PASSWORD=${APP_DATABASE_PASSWORD:-${POSTGRES_PASSWORD:-genai_password}}
        DB_NAME=${APP_DATABASE_DATABASE:-${POSTGRES_DB:-go_genai_stack}}
        
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SEED_FILE" > /dev/null 2>&1 || {
            warning "种子数据加载失败（可能已存在）"
        }
        success "种子数据加载完成"
    else
        warning "种子数据文件不存在: $SEED_FILE"
    fi
else
    warning "跳过种子数据加载（psql 未安装）"
fi

echo ""

# 步骤 5: 启动后端服务
info "步骤 5/5: 启动后端服务..."

cd "$PROJECT_ROOT/backend"

# 下载依赖
info "下载 Go 依赖..."
go mod download > /dev/null 2>&1
success "依赖下载完成"

# 启动服务器
info "启动服务器..."
echo ""
echo "================================================"
echo "  🎉 启动完成！"
echo "================================================"
echo ""
echo "📍 后端服务：http://localhost:8080"
echo "💚 健康检查：http://localhost:8080/health"
echo "📚 Task API："
echo "   - GET    http://localhost:8080/api/tasks"
echo "   - POST   http://localhost:8080/api/tasks"
echo "   - GET    http://localhost:8080/api/tasks/:id"
echo "   - PUT    http://localhost:8080/api/tasks/:id"
echo "   - POST   http://localhost:8080/api/tasks/:id/complete"
echo "   - DELETE http://localhost:8080/api/tasks/:id"
echo ""
echo "💡 提示："
echo "   - Ctrl+C 停止服务器"
echo "   - 查看日志：docker-compose -f docker/docker-compose.yml logs -f"
echo "   - 停止数据库：docker-compose -f docker/docker-compose.yml down"
echo ""
echo "================================================"
echo ""

# 启动服务器（前台运行）
go run cmd/server/main.go

