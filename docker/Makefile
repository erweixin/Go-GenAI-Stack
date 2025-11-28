# ============================================
# Go-GenAI-Stack Docker Makefile
# ============================================
# 简化 Docker 操作的 Makefile
#
# 使用方式：
#   make help           # 查看所有命令
#   make up             # 启动所有服务
#   make down           # 停止所有服务
#   make logs           # 查看日志
# ============================================

.PHONY: help up down restart logs ps build clean

# 默认目标
.DEFAULT_GOAL := help

# ============================================
# 基础命令
# ============================================

## help: 显示此帮助信息
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo " Go-GenAI-Stack Docker 命令"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "基础命令:"
	@echo "  make up             - 启动所有服务（Backend + DB + Redis）"
	@echo "  make down           - 停止所有服务"
	@echo "  make restart        - 重启所有服务"
	@echo "  make ps             - 查看服务状态"
	@echo "  make logs           - 查看所有服务日志"
	@echo "  make logs-backend   - 查看后端日志"
	@echo "  make logs-db        - 查看数据库日志"
	@echo ""
	@echo "构建和清理:"
	@echo "  make build          - 构建后端镜像"
	@echo "  make rebuild        - 重新构建后端镜像"
	@echo "  make clean          - 停止并删除所有容器和数据卷"
	@echo ""
	@echo "高级命令:"
	@echo "  make up-full        - 启动完整服务（包含可观测性）"
	@echo "  make up-infra       - 仅启动基础设施（DB + Redis）"
	@echo "  make up-debug       - 启动调试环境"
	@echo "  make shell          - 进入后端容器"
	@echo "  make db-shell       - 进入数据库容器"
	@echo ""
	@echo "生产环境:"
	@echo "  make up-prod        - 启动生产环境"
	@echo "  make down-prod      - 停止生产环境"
	@echo ""

## up: 启动所有服务
up:
	@echo "🚀 启动所有服务..."
	@docker-compose up -d
	@echo "✅ 服务已启动"
	@echo ""
	@make ps

## down: 停止所有服务
down:
	@echo "🛑 停止所有服务..."
	@docker-compose down
	@echo "✅ 服务已停止"

## restart: 重启所有服务
restart:
	@echo "🔄 重启所有服务..."
	@docker-compose restart
	@echo "✅ 服务已重启"

## ps: 查看服务状态
ps:
	@docker-compose ps

## logs: 查看所有服务日志
logs:
	@docker-compose logs -f

## logs-backend: 查看后端日志
logs-backend:
	@docker-compose logs -f backend

## logs-db: 查看数据库日志
logs-db:
	@docker-compose logs -f postgres

# ============================================
# 构建和清理
# ============================================

## build: 构建后端镜像
build:
	@echo "🏗️  构建后端镜像..."
	@docker-compose build backend
	@echo "✅ 构建完成"

## rebuild: 重新构建后端镜像（不使用缓存）
rebuild:
	@echo "🏗️  重新构建后端镜像（不使用缓存）..."
	@docker-compose build --no-cache backend
	@echo "✅ 构建完成"

## clean: 停止并删除所有容器和数据卷
clean:
	@echo "⚠️  警告：这将删除所有数据！"
	@read -p "确认删除所有数据？(y/N) " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "🗑️  清理所有容器和数据卷..."; \
		docker-compose down -v; \
		echo "✅ 清理完成"; \
	else \
		echo "❌ 已取消"; \
	fi

# ============================================
# 高级命令
# ============================================

## up-full: 启动完整服务（包含可观测性）
up-full:
	@echo "🚀 启动完整服务（包含可观测性）..."
	@docker-compose --profile observability --profile tools up -d
	@echo "✅ 服务已启动"
	@echo ""
	@echo "访问地址："
	@echo "  - 后端 API:      http://localhost:8080/api"
	@echo "  - 健康检查:      http://localhost:8080/health"
	@echo "  - Jaeger UI:     http://localhost:16686"
	@echo "  - Prometheus:    http://localhost:9090"
	@echo "  - Grafana:       http://localhost:3000"
	@echo "  - pgAdmin:       http://localhost:5050"

## up-infra: 仅启动基础设施（DB + Redis）
up-infra:
	@echo "🚀 启动基础设施（DB + Redis）..."
	@docker-compose up -d --scale backend=0
	@echo "✅ 基础设施已启动"

## up-debug: 启动调试环境
up-debug:
	@echo "🚀 启动调试环境..."
	@cd frontend-debug && docker compose up -d
	@echo "✅ 调试环境已启动"
	@echo ""
	@echo "调试端口："
	@echo "  - API:    http://localhost:8080"
	@echo "  - Delve:  localhost:2345"

## shell: 进入后端容器
shell:
	@echo "🐚 进入后端容器..."
	@docker-compose exec backend sh

## db-shell: 进入数据库容器
db-shell:
	@echo "🐚 进入数据库容器..."
	@docker-compose exec postgres psql -U genai -d go_genai_stack

## redis-cli: 进入 Redis CLI
redis-cli:
	@echo "🐚 进入 Redis CLI..."
	@docker-compose exec redis redis-cli -a redis_password

# ============================================
# 生产环境
# ============================================

## up-prod: 启动生产环境
up-prod:
	@echo "🚀 启动生产环境..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "✅ 生产环境已启动"
	@make ps-prod

## down-prod: 停止生产环境
down-prod:
	@echo "🛑 停止生产环境..."
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
	@echo "✅ 生产环境已停止"

## ps-prod: 查看生产环境服务状态
ps-prod:
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

## logs-prod: 查看生产环境日志
logs-prod:
	@docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# ============================================
# 健康检查和测试
# ============================================

## health: 检查服务健康状态
health:
	@echo "🏥 检查服务健康状态..."
	@echo ""
	@echo "后端服务:"
	@curl -s http://localhost:8080/health | jq . || echo "❌ 后端服务不可用"
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose exec -T postgres pg_isready -U genai || echo "❌ 数据库不可用"
	@echo ""
	@echo "Redis:"
	@docker-compose exec -T redis redis-cli -a redis_password ping || echo "❌ Redis 不可用"

## test: 测试 API 端点
test:
	@echo "🧪 测试 API 端点..."
	@echo ""
	@echo "1. 健康检查:"
	@curl -s http://localhost:8080/health | jq .
	@echo ""
	@echo "2. Metrics:"
	@curl -s http://localhost:8080/metrics | head -n 5
	@echo ""
	@echo "3. 任务列表:"
	@curl -s http://localhost:8080/api/v1/tasks | jq .

# ============================================
# 数据备份和恢复
# ============================================

## backup-db: 备份数据库
backup-db:
	@echo "💾 备份数据库..."
	@mkdir -p ./backups
	@docker-compose exec -T postgres pg_dump -U genai go_genai_stack > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ 数据库备份完成: ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

## restore-db: 恢复数据库（使用最新备份）
restore-db:
	@echo "📂 恢复数据库..."
	@LATEST_BACKUP=$$(ls -t ./backups/backup_*.sql | head -n1); \
	if [ -z "$$LATEST_BACKUP" ]; then \
		echo "❌ 未找到备份文件"; \
		exit 1; \
	fi; \
	echo "使用备份文件: $$LATEST_BACKUP"; \
	cat $$LATEST_BACKUP | docker-compose exec -T postgres psql -U genai go_genai_stack; \
	echo "✅ 数据库恢复完成"

# ============================================
# 维护命令
# ============================================

## prune: 清理 Docker 系统（删除未使用的镜像和容器）
prune:
	@echo "🧹 清理 Docker 系统..."
	@docker system prune -a
	@echo "✅ 清理完成"

## update: 拉取最新镜像
update:
	@echo "🔄 拉取最新镜像..."
	@docker-compose pull
	@echo "✅ 镜像更新完成"

## stats: 查看资源使用情况
stats:
	@docker stats --no-stream go-genai-backend go-genai-postgres go-genai-redis

