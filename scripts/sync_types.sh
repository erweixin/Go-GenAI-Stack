#!/bin/bash

# 前后端类型同步脚本
# 使用 tygo 将 Go Structs 转换为 TypeScript 接口

set -e

echo "🔄 Syncing Go Structs to TypeScript interfaces..."

# 检查 tygo 是否安装
if ! command -v tygo &> /dev/null; then
    echo "❌ tygo is not installed."
    echo "Please install it by running:"
    echo "  go install github.com/gzuidhof/tygo@latest"
    exit 1
fi

# 运行 tygo 生成
tygo generate

echo "✅ Frontend types updated successfully!"
echo ""
echo "Generated files:"
echo "  - frontend/src/types/domain/chat.ts"
echo "  - frontend/src/types/domain/llm.ts"
echo "  - frontend/src/types/domain/monitoring.ts"
echo "  - frontend/src/types/shared.ts"

