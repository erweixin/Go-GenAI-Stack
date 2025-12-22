#!/bin/bash

# Pre-commit hook: Auto-format Go and Frontend code
# 在提交前自动格式化 Go 和前端代码

set -e

# 获取项目根目录
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔧 Auto-formatting code before commit..."
echo ""

# 获取暂存的文件
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ No staged files to format"
    exit 0
fi

HAS_GO_FILES=false
HAS_FRONTEND_FILES=false
HAS_BACKEND_NODEJS_FILES=false

# 检查是否有 Go 文件
for file in $STAGED_FILES; do
    if [[ "$file" == *.go ]]; then
        HAS_GO_FILES=true
        break
    fi
done

# 检查是否有前端文件
for file in $STAGED_FILES; do
    if [[ "$file" == frontend/* ]] && [[ "$file" =~ \.(ts|tsx|js|jsx|json|css)$ ]]; then
        HAS_FRONTEND_FILES=true
        break
    fi
done

# 检查是否有 backend-nodejs 文件
for file in $STAGED_FILES; do
    if [[ "$file" == backend-nodejs/* ]] && [[ "$file" =~ \.(ts)$ ]]; then
        HAS_BACKEND_NODEJS_FILES=true
        break
    fi
done

# 格式化 Go 代码
if [ "$HAS_GO_FILES" = true ]; then
    echo "📐 Formatting Go code..."
    
    # 收集需要格式化的 Go 文件
    GO_FILES=()
    for file in $STAGED_FILES; do
        if [[ "$file" == *.go ]] && [ -f "$ROOT_DIR/$file" ]; then
            GO_FILES+=("$ROOT_DIR/$file")
        fi
    done
    
    if [ ${#GO_FILES[@]} -gt 0 ]; then
        # 格式化文件
        for file in "${GO_FILES[@]}"; do
            echo "  Formatting: ${file#$ROOT_DIR/}"
            if command -v goimports >/dev/null 2>&1; then
                goimports -w "$file"
            else
                gofmt -w "$file"
            fi
        done
        
        # 重新添加格式化后的文件到暂存区
        for file in "${GO_FILES[@]}"; do
            REL_PATH="${file#$ROOT_DIR/}"
            git add "$REL_PATH" 2>/dev/null || true
        done
        
        echo "✅ Go code formatted"
    fi
    echo ""
fi

# 格式化前端代码
if [ "$HAS_FRONTEND_FILES" = true ]; then
    echo "💅 Formatting frontend code..."
    
    # 检查是否有 pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        echo "⚠️  pnpm not found, skipping frontend formatting"
        echo "   Install with: npm install -g pnpm"
    else
        cd "$ROOT_DIR/frontend"
        
        # 收集需要格式化的前端文件
        FRONTEND_FILES=()
        for file in $STAGED_FILES; do
            if [[ "$file" == frontend/* ]] && [[ "$file" =~ \.(ts|tsx|js|jsx|json|css)$ ]]; then
                REL_PATH="${file#frontend/}"
                if [ -f "$ROOT_DIR/frontend/$REL_PATH" ]; then
                    FRONTEND_FILES+=("$REL_PATH")
                fi
            fi
        done
        
        if [ ${#FRONTEND_FILES[@]} -gt 0 ]; then
            # 使用 prettier 格式化文件
            if command -v prettier >/dev/null 2>&1; then
                for file in "${FRONTEND_FILES[@]}"; do
                    echo "  Formatting: $file"
                    prettier --write "$file" 2>/dev/null || true
                done
            else
                # 尝试使用 pnpm format（会格式化整个项目）
                pnpm format 2>/dev/null || true
            fi
            
            # 重新添加格式化后的文件到暂存区
            cd "$ROOT_DIR"
            for file in "${FRONTEND_FILES[@]}"; do
                git add "frontend/$file" 2>/dev/null || true
            done
            
            echo "✅ Frontend code formatted"
        fi
        
        cd "$ROOT_DIR"
    fi
    echo ""
fi

# 检查 backend-nodejs ESLint
if [ "$HAS_BACKEND_NODEJS_FILES" = true ]; then
    echo "🔍 Checking backend-nodejs ESLint..."
    
    # 检查是否有 pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        echo "⚠️  pnpm not found, skipping ESLint check"
        echo "   Install with: npm install -g pnpm"
    else
        cd "$ROOT_DIR/backend-nodejs"
        
        # 收集需要检查的 TypeScript 文件
        TS_FILES=()
        for file in $STAGED_FILES; do
            if [[ "$file" == backend-nodejs/* ]] && [[ "$file" =~ \.(ts)$ ]]; then
                REL_PATH="${file#backend-nodejs/}"
                if [ -f "$ROOT_DIR/backend-nodejs/$REL_PATH" ]; then
                    TS_FILES+=("$REL_PATH")
                fi
            fi
        done
        
        if [ ${#TS_FILES[@]} -gt 0 ]; then
            # 运行 ESLint 检查（只检查错误，警告不会阻止提交）
            echo "  Checking ${#TS_FILES[@]} TypeScript file(s)..."
            
            # 运行 lint 并捕获输出和退出码
            LINT_OUTPUT=$(pnpm lint 2>&1)
            LINT_EXIT_CODE=$?
            
            # 检查是否有错误（非零退出码表示有错误）
            if [ $LINT_EXIT_CODE -eq 0 ]; then
                echo "✅ ESLint check passed (warnings are allowed)"
            else
                echo ""
                echo "❌ ESLint check failed! Found errors that must be fixed."
                echo ""
                echo "$LINT_OUTPUT" | grep -E "(error|✖)" | head -20
                echo ""
                echo "   Please fix the errors before committing."
                echo "   Run 'cd backend-nodejs && pnpm lint' to see all issues."
                echo "   Or run 'cd backend-nodejs && pnpm lint:fix' to auto-fix some issues."
                echo ""
                cd "$ROOT_DIR"
                exit 1
            fi
        fi
        
        cd "$ROOT_DIR"
    fi
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Code formatting and linting complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

