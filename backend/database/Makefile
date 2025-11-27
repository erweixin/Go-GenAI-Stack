# Database Makefile
# 简化的数据库管理命令

.PHONY: help status diff apply seed clean lint validate inspect init hash clean-docker seed-docker

# 默认环境
ENV ?= dev

# 环境变量文件路径
ENV_FILE := ../../docker/.env

# Shell 配置：自动加载环境变量
SHELL := /bin/bash
.SHELLFLAGS := -c

# 定义加载环境变量的函数
define load_env
	@if [ -f "$(ENV_FILE)" ]; then \
		set -a; source $(ENV_FILE); set +a; \
	fi
endef

help: ## 显示帮助信息
	@echo "📚 数据库管理命令"
	@echo ""
	@echo "基础命令："
	@echo "  make init          - 创建初始迁移（首次使用）"
	@echo "  make status        - 查看迁移状态"
	@echo "  make diff          - 生成新迁移（需要 NAME=xxx）"
	@echo "  make apply         - 应用迁移到数据库"
	@echo "  make seed          - 加载种子数据（需要 psql）"
	@echo "  make seed-docker   - 加载种子数据（使用 Docker）"
	@echo ""
	@echo "工具命令："
	@echo "  make inspect       - 查看当前数据库结构"
	@echo "  make hash          - 生成迁移校验和"
	@echo "  make lint          - 检查迁移质量"
	@echo "  make validate      - 验证迁移文件"
	@echo "  make clean         - 清空数据库（危险！需要 psql）"
	@echo "  make clean-docker  - 清空数据库（使用 Docker）"
	@echo ""
	@echo "示例："
	@echo "  make init                       # 首次创建初始迁移"
	@echo "  make apply                      # 应用迁移"
	@echo "  make seed-docker                # 加载演示数据"
	@echo "  make diff NAME=add_new_field    # 生成新迁移"
	@echo ""
	@echo "环境变量："
	@echo "  ENV=dev (默认) | prod           # 设置环境"
	@echo ""
	@echo "💡 提示："
	@echo "   环境变量会自动从 ../../docker/.env 加载"
	@echo "   确保该文件存在并包含正确的配置"

init: ## 创建初始迁移（首次使用）
	@echo "🚀 创建初始迁移..."
	@if [ -n "$$(ls -A migrations 2>/dev/null)" ]; then \
		echo "❌ 错误：migrations/ 目录不为空"; \
		echo "   如果要重新初始化，请先删除 migrations/ 目录"; \
		exit 1; \
	fi
	@mkdir -p migrations
	@TIMESTAMP=$$(date +%Y%m%d%H%M%S); \
	cp schema.sql migrations/$${TIMESTAMP}_initial_schema.sql && \
	echo "✅ 初始迁移已创建: migrations/$${TIMESTAMP}_initial_schema.sql"
	@$(MAKE) hash
	@echo "💡 下一步：运行 'make apply' 应用迁移"

hash: ## 生成迁移校验和
	@echo "🔐 生成校验和..."
	@atlas migrate hash --env $(ENV)
	@echo "✅ 校验和已生成"

status: ## 查看迁移状态
	@echo "📊 迁移状态..."
	atlas migrate status --env $(ENV)

diff: ## 生成新迁移（需要 NAME=xxx）
ifndef NAME
	@echo "❌ 错误：请指定迁移名称"
	@echo "   make diff NAME=add_new_field"
	@exit 1
endif
	@echo "🔍 生成迁移: $(NAME)..."
	atlas migrate diff $(NAME) --env $(ENV)
	@echo "✅ 迁移已生成，请检查 migrations/ 目录"

apply: ## 应用迁移
	@echo "⚠️  将要应用迁移到数据库"
	@echo ""
	@atlas migrate status --env $(ENV) || true
	@echo ""
	@read -p "确认应用？(y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	atlas migrate apply --env $(ENV)
	@echo "✅ 迁移已应用"

seed: ## 加载种子数据（需要 psql）
	@echo "🌱 加载种子数据..."
	@if [ -z "$$POSTGRES_USER" ]; then \
		echo "❌ 错误：请先加载环境变量"; \
		echo "   source ../../docker/.env"; \
		exit 1; \
	fi
	@for file in seed/*.sql; do \
		if [ -f "$$file" ]; then \
			echo "📝 加载: $$(basename $$file)"; \
			psql "postgresql://$$POSTGRES_USER:$$POSTGRES_PASSWORD@$$POSTGRES_HOST:$$POSTGRES_PORT/$$POSTGRES_DB" -f "$$file"; \
		fi \
	done
	@echo "✅ 种子数据已加载"

seed-docker: ## 加载种子数据（使用 Docker）
	@echo "🌱 加载种子数据（使用 Docker）..."
	@if [ -f "$(ENV_FILE)" ]; then \
		set -a; source $(ENV_FILE); set +a; \
		for file in seed/*.sql; do \
			if [ -f "$$file" ]; then \
				echo "📝 加载: $$(basename $$file)"; \
				docker exec -i go-genai-postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB < "$$file"; \
			fi; \
		done; \
		echo "✅ 种子数据已加载"; \
	else \
		echo "❌ 错误：$(ENV_FILE) 不存在"; \
		exit 1; \
	fi

inspect: ## 查看当前数据库结构
	@echo "🔍 数据库结构..."
	atlas schema inspect --env $(ENV) --format "{{ sql . }}"

lint: ## 检查迁移质量
	@echo "🔍 检查迁移质量..."
	atlas migrate lint --env $(ENV) --latest 1

validate: ## 验证迁移文件
	@echo "✅ 验证迁移文件..."
	atlas migrate validate --env $(ENV)

clean: ## 清空数据库（危险！需要 psql）
	@echo "⚠️  警告：这将删除所有表和数据！"
	@read -p "确认清空数据库？输入 'yes' 继续: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@echo "🗑️  清空数据库..."
	@if [ -z "$$POSTGRES_USER" ]; then \
		echo "❌ 错误：请先加载环境变量"; \
		exit 1; \
	fi
	psql "postgresql://$$POSTGRES_USER:$$POSTGRES_PASSWORD@$$POSTGRES_HOST:$$POSTGRES_PORT/$$POSTGRES_DB" \
		-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@echo "✅ 数据库已清空"
	@echo "💡 运行 'make apply' 重新创建表"

clean-docker: ## 清空数据库（使用 Docker）
	@echo "⚠️  警告：这将删除所有表和数据！"
	@read -p "确认清空数据库？输入 'yes' 继续: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@echo "🗑️  清空数据库..."
	@if [ -f "$(ENV_FILE)" ]; then \
		set -a; source $(ENV_FILE); set +a; \
		docker exec -i go-genai-postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB \
			-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"; \
		echo "✅ 数据库已清空"; \
		echo "💡 下一步："; \
		echo "   1. 删除旧迁移: rm -rf migrations && mkdir migrations"; \
		echo "   2. 创建初始迁移: make init"; \
		echo "   3. 应用迁移: make apply"; \
	else \
		echo "❌ 错误：$(ENV_FILE) 不存在"; \
		exit 1; \
	fi

