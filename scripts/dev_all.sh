#!/bin/bash

# 启动所有服务（Backend + Web + Mobile）
# 用于本地开发

echo "🚀 Starting all services..."
echo ""

# 启动后端
echo "📦 Starting Backend (Go)..."
cd backend && go run cmd/server/main.go &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo ""

# 启动 Web 前端
echo "🌐 Starting Web (React)..."
cd web && npm run dev &
WEB_PID=$!
echo "   Web PID: $WEB_PID"
echo ""

# 启动 Mobile（可选，取消注释以启用）
# echo "📱 Starting Mobile (React Native)..."
# cd mobile && npm run ios &  # 或 npm run android
# MOBILE_PID=$!
# echo "   Mobile PID: $MOBILE_PID"
# echo ""

echo "✅ All services started!"
echo ""
echo "Services:"
echo "  - Backend:  http://localhost:8080"
echo "  - Web:      http://localhost:5173"
# echo "  - Mobile:   Running in simulator"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 等待所有后台进程
wait

