#!/bin/bash
# ============================================
# 生产环境配置验证脚本
# ============================================
# 验证 .env 文件是否包含所有必需的配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🔍 验证生产环境配置...${NC}"
echo ""

# 检查 .env 是否存在
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 错误: 未找到 .env 文件${NC}"
    echo "运行: cp env.example .env"
    exit 1
fi

source .env

# ============================================
# 必需配置检查
# ============================================
echo -e "${BLUE}📋 检查必需配置...${NC}"

ERRORS=0
WARNINGS=0

# 必需的 4 个密码配置
REQUIRED_PASSWORDS=(
    "POSTGRES_PASSWORD:数据库密码"
    "REDIS_PASSWORD:Redis 密码"
    "APP_JWT_SECRET:JWT 密钥"
    "GRAFANA_PASSWORD:Grafana 密码"
)

for item in "${REQUIRED_PASSWORDS[@]}"; do
    var="${item%%:*}"
    desc="${item##*:}"
    
    if [ -z "${!var}" ]; then
        echo -e "${RED}✗ $desc ($var) 未设置${NC}"
        ERRORS=$((ERRORS + 1))
    elif [[ "${!var}" == CHANGE_ME* ]]; then
        echo -e "${RED}✗ $desc ($var) 仍使用默认值 (CHANGE_ME)${NC}"
        ERRORS=$((ERRORS + 1))
    elif [ ${#!var} -lt 16 ]; then
        echo -e "${YELLOW}⚠ $desc ($var) 太短 (< 16 字符)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ $desc ($var) 已设置${NC}"
    fi
done

# ============================================
# 安全配置检查
# ============================================
echo ""
echo -e "${BLUE}🔒 检查安全配置...${NC}"

# SSL 模式检查
if [ "${APP_DATABASE_SSL_MODE:-disable}" != "require" ] && [ "${APP_DATABASE_SSL_MODE:-disable}" != "verify-full" ]; then
    echo -e "${YELLOW}⚠ 数据库 SSL 未启用或配置不严格${NC}"
    echo -e "${YELLOW}  当前: ${APP_DATABASE_SSL_MODE:-disable}${NC}"
    echo -e "${YELLOW}  推荐: require 或 verify-full${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ 数据库 SSL 已启用${NC}"
fi

# 日志级别检查
if [ "${APP_LOGGING_LEVEL:-info}" == "debug" ]; then
    echo -e "${YELLOW}⚠ 日志级别为 debug，不推荐用于生产环境${NC}"
    echo -e "${YELLOW}  推荐使用: info 或 warn${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ 日志级别适合生产环境 (${APP_LOGGING_LEVEL:-info})${NC}"
fi

# 环境标识检查
if [ "${APP_ENV:-production}" != "production" ]; then
    echo -e "${YELLOW}⚠ APP_ENV 应该设置为 production${NC}"
    echo -e "${YELLOW}  当前: ${APP_ENV}${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ APP_ENV 已设置为 production${NC}"
fi

# ============================================
# JWT 密钥强度检查
# ============================================
if [ -n "${APP_JWT_SECRET}" ] && [ "${APP_JWT_SECRET}" != "CHANGE_ME"* ]; then
    if [ ${#APP_JWT_SECRET} -lt 32 ]; then
        echo -e "${YELLOW}⚠ JWT 密钥建议至少 32 字符${NC}"
        echo -e "${YELLOW}  当前长度: ${#APP_JWT_SECRET} 字符${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ JWT 密钥强度足够 (${#APP_JWT_SECRET} 字符)${NC}"
    fi
fi

# ============================================
# 配置完整性总结
# ============================================
echo ""
echo -e "${BLUE}📊 配置总结:${NC}"
TOTAL_VARS=$(grep -E "^[A-Z_]+=" .env | wc -l | tr -d ' ')
echo "  环境变量总数: $TOTAL_VARS"
echo "  必需密码已设置: $((4 - ERRORS))/4"
echo "  错误: $ERRORS"
echo "  警告: $WARNINGS"
echo ""

# ============================================
# 结果判定
# ============================================
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ 配置验证失败${NC}"
    echo ""
    echo -e "${YELLOW}💡 快速修复:${NC}"
    echo "  1. 编辑 .env 文件: vim .env"
    echo "  2. 修改所有 CHANGE_ME 开头的值"
    echo "  3. 生成安全密钥:"
    echo "     openssl rand -base64 32  # 用于 APP_JWT_SECRET"
    echo "     openssl rand -base64 24  # 用于密码"
    echo ""
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  配置有 $WARNINGS 个警告${NC}"
    echo -e "${YELLOW}可以继续部署，但建议查看上述警告${NC}"
    echo ""
fi

echo -e "${GREEN}✅ 配置验证通过！${NC}"
echo ""
echo -e "${BLUE}💡 下一步:${NC}"
echo "  运行: ./start.sh"
echo ""
