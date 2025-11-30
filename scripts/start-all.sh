#!/bin/bash

# ============================================
# 启动所有服务（业务 + 监控）
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================"
echo "启动 Go-GenAI-Stack 完整环境"
echo "============================================"
echo ""

# 启动生产服务
echo "📦 启动业务服务..."
cd "$PROJECT_ROOT/docker/prod"
./start.sh

echo ""
echo "----------------------------------------"
echo ""

# 启动监控服务
echo "📊 启动监控服务..."
cd "$PROJECT_ROOT/docker/monitoring"
./start.sh

echo ""
echo "============================================"
echo "✅ 所有服务启动完成！"
echo "============================================"
echo ""
echo "业务服务："
echo "  - Frontend: http://localhost:80"
echo "  - Backend API: http://localhost:8080"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "监控服务："
echo "  - Sentry: http://localhost:9000"
echo "  - Jaeger UI: http://localhost:16686"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000"
echo ""

