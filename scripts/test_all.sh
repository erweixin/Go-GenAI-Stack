#!/bin/bash

# 运行所有项目的测试
# Backend + Web + Mobile

set -e

echo "🧪 Running all tests..."
echo ""

# 测试后端
echo "📦 Testing Backend (Go)..."
cd backend && go test ./... -v
echo "✅ Backend tests passed!"
echo ""

# 测试 Web
echo "🌐 Testing Web (React)..."
cd web && npm run test
echo "✅ Web tests passed!"
echo ""

# 测试 Mobile（可选）
# echo "📱 Testing Mobile (React Native)..."
# cd mobile && npm run test
# echo "✅ Mobile tests passed!"
# echo ""

echo "🎉 All tests passed!"

