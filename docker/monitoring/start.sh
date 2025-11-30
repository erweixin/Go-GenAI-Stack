#!/bin/bash

# ============================================
# 启动 Go-GenAI-Stack 监控服务
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "启动 Go-GenAI-Stack 监控服务"
echo "============================================"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先复制模板并配置环境变量："
    echo "  cp env.template .env"
    echo "  # 然后编辑 .env 文件"
    exit 1
fi

# 检查必需的环境变量
source .env

if [ -z "$SENTRY_SECRET_KEY" ] || [ "$SENTRY_SECRET_KEY" = "your-secret-key-here-please-change-me" ]; then
    echo "❌ 错误: 请设置 SENTRY_SECRET_KEY"
    echo "生成密钥: openssl rand -base64 32"
    exit 1
fi

if [ -z "$SENTRY_POSTGRES_PASSWORD" ] || [ "$SENTRY_POSTGRES_PASSWORD" = "your-postgres-password-here" ]; then
    echo "❌ 错误: 请设置 SENTRY_POSTGRES_PASSWORD"
    exit 1
fi

if [ -z "$GRAFANA_PASSWORD" ] || [ "$GRAFANA_PASSWORD" = "your-grafana-password-here" ]; then
    echo "❌ 错误: 请设置 GRAFANA_PASSWORD"
    exit 1
fi

echo ""
echo "✅ 环境变量检查通过"
echo ""

# 启动服务
echo "🚀 启动监控服务..."
docker compose up -d

echo ""
echo "============================================"
echo "监控服务启动成功！"
echo "============================================"
echo ""
echo "访问地址："
echo "  - Sentry:     http://localhost:${SENTRY_PORT:-9000}"
echo "  - Jaeger UI:  http://localhost:${JAEGER_UI_PORT:-16686}"
echo "  - Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
echo "  - Grafana:    http://localhost:${GRAFANA_PORT:-3000}"
echo ""
echo "注意："
echo "  1. 首次启动 Sentry 需要初始化："
echo "     docker compose exec sentry-web sentry upgrade --noinput"
echo "     docker compose exec sentry-web sentry createuser"
echo ""
echo "  2. Grafana 默认账号："
echo "     用户名: ${GRAFANA_USER:-admin}"
echo "     密码: (在 .env 中配置)"
echo ""
echo "查看日志："
echo "  docker compose logs -f"
echo ""

