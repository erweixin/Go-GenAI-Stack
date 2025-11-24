# ============================================
# Go-GenAI-Stack 后端 Dockerfile
# ============================================
# 多阶段构建，确保镜像体积小且安全
#
# 构建方式：
#   docker build -t go-genai-stack:latest -f backend/Dockerfile .
#
# 运行方式：
#   docker run -p 8080:8080 --env-file docker/.env go-genai-stack:latest
# ============================================

# ============================================
# Stage 1: Builder - 编译 Go 应用
# ============================================
FROM golang:1.23-alpine AS builder

# 安装编译所需的依赖
RUN apk add --no-cache \
    git \
    ca-certificates \
    tzdata

# 设置工作目录
WORKDIR /build

# 复制 go.mod 和 go.sum（利用 Docker 缓存）
COPY backend/go.mod backend/go.sum ./

# 下载依赖（这层会被缓存，除非 go.mod/go.sum 改变）
RUN go mod download && go mod verify

# 复制源代码
COPY backend/ .

# 编译应用
# - CGO_ENABLED=0: 静态编译，不依赖 glibc
# - GOOS=linux: 目标操作系统
# - -ldflags="-s -w": 去除调试信息，减小体积
# - -trimpath: 移除文件系统路径信息
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
    -ldflags="-s -w -X main.Version=$(git describe --tags --always --dirty 2>/dev/null || echo 'dev') -X main.BuildTime=$(date -u '+%Y-%m-%d_%H:%M:%S')" \
    -trimpath \
    -o /app/server \
    ./cmd/server/main.go

# ============================================
# Stage 2: Runtime - 最小化运行时镜像
# ============================================
FROM alpine:3.19

# 安装运行时依赖
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    && addgroup -g 1000 app \
    && adduser -D -u 1000 -G app app

# 设置时区（可选，默认 UTC）
ENV TZ=UTC

# 设置工作目录
WORKDIR /app

# 从 builder 阶段复制编译好的二进制文件
COPY --from=builder --chown=app:app /app/server /app/server

# 复制配置文件（如果需要）
# COPY --chown=app:app backend/configs/ /app/configs/

# 创建日志目录
RUN mkdir -p /app/logs && chown app:app /app/logs

# 切换到非 root 用户（安全最佳实践）
USER app

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# 启动应用
ENTRYPOINT ["/app/server"]

# ============================================
# 镜像元数据
# ============================================
LABEL maintainer="Go-GenAI-Stack Team" \
      description="Go-GenAI-Stack Backend Service" \
      version="1.0.0"

# ============================================
# 使用说明
# ============================================
# 
# 1. 构建镜像：
#    docker build -t go-genai-stack:latest -f backend/Dockerfile .
#
# 2. 运行容器：
#    docker run -d \
#      -p 8080:8080 \
#      --env-file docker/.env \
#      --name go-genai-backend \
#      go-genai-stack:latest
#
# 3. 查看日志：
#    docker logs -f go-genai-backend
#
# 4. 健康检查：
#    curl http://localhost:8080/health
#
# 5. 进入容器：
#    docker exec -it go-genai-backend sh
#
# 6. 停止容器：
#    docker stop go-genai-backend
# ============================================

