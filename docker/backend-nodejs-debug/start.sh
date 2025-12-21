#!/bin/bash

# ============================================
# Node.js 后端调试环境启动脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Node.js Backend Debug Environment..."
echo ""

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# 启动服务
echo "📦 Starting services..."
docker compose up -d

# 等待服务健康
echo ""
echo "⏳ Waiting for services to be healthy..."
timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker compose ps | grep -q "healthy"; then
        echo "✅ All services are healthy!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
done

echo ""
echo ""

# 显示服务状态
echo "📊 Service Status:"
docker compose ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Node.js Backend Debug Environment is ready!"
echo ""
echo "📋 Service Information:"
echo "   PostgreSQL: localhost:5436"
echo "   Redis:      localhost:6380"
echo ""
echo "🔗 Connection Details:"
echo "   Database: go_genai_stack"
echo "   User:     genai"
echo "   Password: genai_password"
echo ""
echo "💡 Next Steps:"
echo "   1. Update your .env file in backend-nodejs:"
echo "      DATABASE_HOST=localhost"
echo "      DATABASE_PORT=5436"
echo "      DATABASE_USER=genai"
echo "      DATABASE_PASSWORD=genai_password"
echo "      DATABASE_NAME=go_genai_stack"
echo "      REDIS_HOST=localhost"
echo "      REDIS_PORT=6380"
echo ""
echo "   2. Start your Node.js backend:"
echo "      cd backend-nodejs && pnpm dev"
echo ""
echo "   3. Check health:"
echo "      curl http://localhost:8081/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

