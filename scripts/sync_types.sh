#!/bin/bash

# 前后端类型同步脚本（pnpm workspace 版本）
# 使用 tygo 将 Go Structs 转换为 TypeScript 接口
# 生成到 shared/types，供 Web 和 Mobile 共享

set -e

echo "🔄 Syncing Go Structs to TypeScript interfaces..."

# 检查 tygo 是否安装
if ! command -v tygo &> /dev/null; then
    echo "❌ tygo is not installed."
    echo "Please install it by running:"
    echo "  go install github.com/gzuidhof/tygo@latest"
    exit 1
fi

# 运行 tygo 生成（生成到 shared/types）
tygo generate

echo "✅ Types generated successfully!"
echo ""
echo "Generated files in frontend/shared/types:"
echo "  - frontend/shared/types/domains/chat.ts"
echo "  - frontend/shared/types/domains/llm.ts"
echo "  - frontend/shared/types/domains/monitoring.ts"
echo ""
echo "Web and Mobile can now import via:"
echo "  import { SendMessageRequest } from '@go-genai-stack/types';"
echo ""
echo "🎉 All frontend types are now in sync with backend!"

