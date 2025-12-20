#!/bin/bash

# 监控和安全功能测试脚本
# 演示请求追踪、Metrics 监控和 API 限流的使用

BASE_URL="${BASE_URL:-http://localhost:8081}"

echo "=========================================="
echo "监控和安全功能测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 测试请求追踪
echo -e "${BLUE}1. 测试请求追踪（TraceID/RequestID）${NC}"
echo "----------------------------------------"
echo "发送请求并查看响应头中的追踪信息："
echo ""

RESPONSE=$(curl -s -i -X GET "$BASE_URL/health")
TRACE_ID=$(echo "$RESPONSE" | grep -i "X-Trace-Id" | cut -d' ' -f2 | tr -d '\r')
REQUEST_ID=$(echo "$RESPONSE" | grep -i "X-Request-Id" | cut -d' ' -f2 | tr -d '\r')

echo -e "${GREEN}✓ TraceID:${NC} $TRACE_ID"
echo -e "${GREEN}✓ RequestID:${NC} $REQUEST_ID"
echo ""

# 测试分布式追踪（传递 TraceID）
echo "测试分布式追踪（传递自定义 TraceID）："
CUSTOM_TRACE_ID="my-custom-trace-123"
RESPONSE2=$(curl -s -i -H "X-Trace-Id: $CUSTOM_TRACE_ID" -X GET "$BASE_URL/health")
RECEIVED_TRACE_ID=$(echo "$RESPONSE2" | grep -i "X-Trace-Id" | cut -d' ' -f2 | tr -d '\r')

if [ "$RECEIVED_TRACE_ID" = "$CUSTOM_TRACE_ID" ]; then
  echo -e "${GREEN}✓ 分布式追踪成功：使用传入的 TraceID${NC}"
else
  echo -e "${YELLOW}⚠ TraceID 不匹配（可能生成了新的）${NC}"
fi
echo ""

# 2. 测试 Metrics 监控
echo -e "${BLUE}2. 测试 Metrics 监控${NC}"
echo "----------------------------------------"
echo "访问 /metrics 端点："
echo ""

METRICS=$(curl -s "$BASE_URL/metrics")
if [ -n "$METRICS" ]; then
  echo -e "${GREEN}✓ Metrics 端点可用${NC}"
  echo ""
  echo "指标示例（前 10 行）："
  echo "$METRICS" | head -10
  echo "..."
  echo ""
  
  # 统计指标数量
  METRIC_COUNT=$(echo "$METRICS" | grep -c "^[^#]" || echo "0")
  echo -e "${GREEN}✓ 共 $METRIC_COUNT 个指标${NC}"
else
  echo -e "${RED}✗ Metrics 端点不可用${NC}"
fi
echo ""

# 3. 测试 API 限流
echo -e "${BLUE}3. 测试 API 限流${NC}"
echo "----------------------------------------"
echo "测试登录接口限流（每分钟最多 5 次）："
echo ""

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

for i in {1..7}; do
  echo -n "请求 $i: "
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}')
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  REMAINING=$(echo "$RESPONSE" | grep -i "X-RateLimit-Remaining" | cut -d' ' -f2 | tr -d '\r' || echo "")
  
  if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ 401 (正常，密码错误)${NC} - 剩余: $REMAINING"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$HTTP_CODE" = "429" ]; then
    echo -e "${YELLOW}⚠ 429 (限流触发)${NC} - 剩余: $REMAINING"
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
  else
    echo -e "${RED}✗ $HTTP_CODE (意外状态码)${NC}"
  fi
  
  sleep 0.5
done

echo ""
echo "结果统计："
echo -e "  ${GREEN}正常请求:${NC} $SUCCESS_COUNT"
echo -e "  ${YELLOW}被限流:${NC} $RATE_LIMITED_COUNT"
echo ""

# 4. 查看限流响应头
echo -e "${BLUE}4. 查看限流响应头${NC}"
echo "----------------------------------------"
echo "发送一个登录请求并查看响应头："
echo ""

curl -s -i -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' | \
  grep -i "X-RateLimit\|Retry-After" | \
  sed 's/^/  /'

echo ""

# 5. 总结
echo "=========================================="
echo -e "${GREEN}测试完成！${NC}"
echo "=========================================="
echo ""
echo "📚 详细文档："
echo "  - docs/MONITORING_AND_SECURITY.md (完整文档)"
echo "  - docs/QUICK_START_MONITORING.md (快速参考)"
echo ""
echo "🔧 下一步："
echo "  1. 配置 Prometheus 抓取 /metrics"
echo "  2. 在 Grafana 中创建监控 Dashboard"
echo "  3. 根据实际需求调整限流策略"
echo ""

