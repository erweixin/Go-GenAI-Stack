#!/bin/bash

# 开发环境启动脚本

echo "🚀 Starting Go-GenAI-Stack Backend..."
echo ""

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21+"
    exit 1
fi

# 显示 Go 版本
echo "📦 Go version:"
go version
echo ""

# 安装依赖
echo "📥 Installing dependencies..."
go mod download
echo ""

# 运行服务器
echo "🎯 Starting server on :8080..."
echo "💚 Health Check: http://localhost:8080/health"
echo "📚 Chat API: http://localhost:8080/api/chat"
echo "🤖 LLM API: http://localhost:8080/api/llm"
echo ""

go run cmd/server/main.go

