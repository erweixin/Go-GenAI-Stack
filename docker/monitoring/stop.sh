#!/bin/bash

# ============================================
# 停止 Go-GenAI-Stack 监控服务
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "停止 Go-GenAI-Stack 监控服务"
echo "============================================"

# 检查是否要清理数据
CLEAN=false
if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
    CLEAN=true
    echo ""
    echo "⚠️  警告: 将删除所有数据卷！"
    read -p "确认删除所有监控数据? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 已取消"
        exit 1
    fi
fi

echo ""
echo "🛑 停止监控服务..."

if [ "$CLEAN" = true ]; then
    docker compose down -v
    echo ""
    echo "✅ 监控服务已停止，数据已清理"
else
    docker compose down
    echo ""
    echo "✅ 监控服务已停止（数据已保留）"
    echo ""
    echo "💡 提示："
    echo "  - 重新启动: ./start.sh"
    echo "  - 清理数据: ./stop.sh --clean"
fi

echo ""

