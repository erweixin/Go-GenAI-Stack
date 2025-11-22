#!/bin/bash

# 前后端类型同步脚本（Monorepo 版本）
# 使用 tygo 将 Go Structs 转换为 TypeScript 接口
# 适用于 Backend + Web + Mobile 架构

set -e

echo "🔄 Syncing Go Structs to TypeScript interfaces..."

# 检查 tygo 是否安装
if ! command -v tygo &> /dev/null; then
    echo "❌ tygo is not installed."
    echo "Please install it by running:"
    echo "  go install github.com/gzuidhof/tygo@latest"
    exit 1
fi

# 运行 tygo 生成（生成到 web/）
tygo generate

echo "✅ Types generated successfully!"
echo ""
echo "Generated files:"
echo "  - web/src/types/domains/chat.ts"
echo "  - web/src/types/domains/llm.ts"
echo "  - web/src/types/domains/monitoring.ts"
echo "  - web/src/types/shared.ts"
echo ""
echo "Mobile types are automatically synced via symlink:"
echo "  mobile/src/types/domains → web/src/types/domains"
echo ""
echo "🎉 All frontend types are now in sync with backend!"

