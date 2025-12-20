# ============================================
# Go-GenAI-Stack Node.js 后端 Dockerfile
# ============================================
# 多阶段构建，确保镜像体积小且安全
#
# 构建方式：
#   docker build -t go-genai-stack-nodejs:latest -f backend-nodejs/Dockerfile .
#
# 运行方式：
#   docker run -p 8080:8080 --env-file .env go-genai-stack-nodejs:latest
# ============================================

# ============================================
# Stage 1: Builder - 安装依赖并编译 TypeScript
# ============================================
FROM node:22-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /build

# 复制 package.json 和 pnpm-lock.yaml（利用 Docker 缓存）
COPY backend-nodejs/package.json backend-nodejs/pnpm-lock.yaml* ./

# 安装依赖（这层会被缓存，除非 package.json 改变）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY backend-nodejs/ .

# 编译 TypeScript
RUN pnpm build

# ============================================
# Stage 2: Runtime - 最小化运行时镜像
# ============================================
FROM node:22-alpine

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 创建非 root 用户
RUN addgroup -g 1000 nodejs && \
    adduser -D -u 1000 -G nodejs nodejs

# 设置工作目录
WORKDIR /app

# 从 builder 复制依赖和编译后的代码
COPY --from=builder --chown=nodejs:nodejs /build/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /build/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /build/package.json ./

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/cmd/server/main.js"]

