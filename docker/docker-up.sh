#!/bin/bash
# ============================================
# Go-GenAI-Stack Docker 快速启动脚本
# ============================================
# 一键启动完整环境（App + DB + Cache）
#
# 使用方式：
#   ./docker/docker-up.sh          # 启动基础服务（Backend + DB + Redis）
#   ./docker/docker-up.sh --full   # 启动完整服务（包含可观测性组件）
#   ./docker/docker-up.sh --rebuild # 重新构建镜像
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 切换到 docker 目录
cd "$SCRIPT_DIR"

# ============================================
# 检查依赖
# ============================================
check_dependencies() {
    info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    success "依赖检查通过"
}

# ============================================
# 检查 .env 文件
# ============================================
check_env_file() {
    info "检查环境变量配置..."
    
    if [ ! -f .env ]; then
        warning ".env 文件不存在，从 env.example 复制..."
        cp env.example .env
        success "已创建 .env 文件，请根据需要修改配置"
        
        # 提示用户可能需要修改的配置
        warning "请注意修改以下配置（如果需要）："
        echo "  - 数据库密码: POSTGRES_PASSWORD"
        echo "  - Redis 密码: REDIS_PASSWORD"
        echo "  - 端口配置: APP_SERVER_PORT, DB_PORT, REDIS_PORT"
        echo ""
        read -p "是否继续？(y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        success ".env 文件已存在"
    fi
}

# ============================================
# 解析命令行参数
# ============================================
REBUILD=false
FULL=false
DETACH=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            REBUILD=true
            shift
            ;;
        --full)
            FULL=true
            shift
            ;;
        --no-detach)
            DETACH=false
            shift
            ;;
        *)
            error "未知参数: $1"
            echo "使用方式："
            echo "  ./docker-up.sh          # 启动基础服务"
            echo "  ./docker-up.sh --full   # 启动完整服务（包含可观测性）"
            echo "  ./docker-up.sh --rebuild # 重新构建镜像"
            exit 1
            ;;
    esac
done

# ============================================
# 主流程
# ============================================
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 Go-GenAI-Stack Docker 启动"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 1. 检查依赖
    check_dependencies
    
    # 2. 检查 .env 文件
    check_env_file
    
    # 3. 停止已存在的容器
    info "停止已存在的容器..."
    docker-compose down || docker compose down || true
    
    # 4. 构建/启动服务
    COMPOSE_CMD="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker compose"
    fi
    
    COMPOSE_ARGS=""
    
    if [ "$FULL" = true ]; then
        info "启动完整服务（包含可观测性组件）..."
        COMPOSE_ARGS="--profile observability --profile tools"
    else
        info "启动基础服务（Backend + DB + Redis）..."
    fi
    
    if [ "$REBUILD" = true ]; then
        info "重新构建镜像..."
        $COMPOSE_CMD build --no-cache backend
    fi
    
    if [ "$DETACH" = true ]; then
        $COMPOSE_CMD up -d $COMPOSE_ARGS
    else
        $COMPOSE_CMD up $COMPOSE_ARGS
    fi
    
    # 5. 等待服务启动
    if [ "$DETACH" = true ]; then
        info "等待服务启动..."
        sleep 5
        
        # 6. 检查服务状态
        echo ""
        info "服务状态："
        $COMPOSE_CMD ps
        
        # 7. 健康检查
        echo ""
        info "健康检查..."
        
        MAX_RETRIES=30
        RETRY_COUNT=0
        
        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
                success "后端服务健康检查通过"
                break
            fi
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo -n "."
            sleep 2
        done
        
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            error "后端服务启动失败，请检查日志"
            echo ""
            info "查看日志："
            echo "  docker logs go-genai-backend"
            exit 1
        fi
        
        # 8. 显示访问信息
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        success "所有服务启动成功！"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📚 访问地址："
        echo "  - 后端 API:      http://localhost:8080/api"
        echo "  - 健康检查:      http://localhost:8080/health"
        echo "  - Prometheus:    http://localhost:8080/metrics"
        echo "  - PostgreSQL:    localhost:5432"
        echo "  - Redis:         localhost:6379"
        
        if [ "$FULL" = true ]; then
            echo ""
            echo "🔍 可观测性组件："
            echo "  - Jaeger UI:     http://localhost:16686"
            echo "  - Prometheus:    http://localhost:9090"
            echo "  - Grafana:       http://localhost:3000"
            echo "  - pgAdmin:       http://localhost:5050"
        fi
        
        echo ""
        echo "📖 常用命令："
        echo "  - 查看日志:      docker logs -f go-genai-backend"
        echo "  - 停止服务:      docker-compose down"
        echo "  - 重启服务:      docker-compose restart backend"
        echo "  - 进入容器:      docker exec -it go-genai-backend sh"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
}

# 运行主流程
main

