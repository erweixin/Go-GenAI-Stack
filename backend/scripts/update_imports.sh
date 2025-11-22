#!/bin/bash
# update_imports.sh - 批量更新 import 路径
# 
# 使用方式:
#   chmod +x scripts/update_imports.sh
#   ./scripts/update_imports.sh

set -e

echo "🔄 开始更新 import 路径..."
echo ""

# 备份提示
echo "⚠️  建议先提交当前更改或创建备份"
read -p "是否继续? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消"
    exit 1
fi

# 更新 infra/ -> infrastructure/
echo "1️⃣ 更新 backend/infra/ -> backend/infrastructure/ ..."
find . -name "*.go" -type f -exec sed -i '' 's|github.com/erweixin/go-genai-stack/backend/infra/|github.com/erweixin/go-genai-stack/backend/infrastructure/|g' {} +

# 更新 shared/middleware -> infrastructure/middleware
echo "2️⃣ 更新 backend/shared/middleware -> backend/infrastructure/middleware ..."
find . -name "*.go" -type f -exec sed -i '' 's|github.com/erweixin/go-genai-stack/backend/shared/middleware|github.com/erweixin/go-genai-stack/backend/infrastructure/middleware|g' {} +

# 更新 go.mod
echo "3️⃣ 更新依赖..."
go mod tidy

# 格式化代码
echo "4️⃣ 格式化代码..."
go fmt ./...

# 检查编译
echo "5️⃣ 检查编译..."
if go build ./...; then
    echo "✅ 编译成功！"
else
    echo "❌ 编译失败，请检查错误"
    exit 1
fi

echo ""
echo "🎉 Import 路径更新完成！"
echo ""
echo "下一步:"
echo "  1. 运行测试: go test ./..."
echo "  2. 检查改动: git diff"
echo "  3. 提交更改: git add . && git commit -m 'refactor: migrate to infrastructure/'"

