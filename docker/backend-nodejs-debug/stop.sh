#!/bin/bash

# ============================================
# Node.js 后端调试环境停止脚本
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🛑 Stopping Node.js Backend Debug Environment..."
echo ""

# 停止服务
docker compose down

echo ""
echo "✅ Node.js Backend Debug Environment stopped."
echo ""
echo "💡 Note: Data volumes are preserved."
echo "   To remove volumes, run: docker compose down -v"
echo ""

