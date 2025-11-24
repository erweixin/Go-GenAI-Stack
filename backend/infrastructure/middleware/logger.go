package middleware

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/logger"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/metrics"
	"go.uber.org/zap"
)

// Logger 请求日志中间件
//
// 功能：
//   - 记录 HTTP 请求日志（方法、路径、状态码、延迟）
//   - 如果启用了结构化日志，使用 zap 输出 JSON 日志
//   - 如果禁用了结构化日志，使用标准 log 输出文本日志
//   - 集成 Metrics 记录（如果启用）
func Logger() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		start := time.Now()
		path := string(c.Path())
		method := string(c.Method())

		// 获取 TraceID 和 RequestID
		traceID := GetTraceID(c)
		requestID := GetRequestID(c)

		// 增加正在处理的请求计数
		metrics.IncInFlight()
		defer metrics.DecInFlight()

		c.Next(ctx)

		// 计算请求耗时
		latency := time.Since(start)
		statusCode := c.Response.StatusCode()

		// 使用结构化日志（如果启用）
		globalLogger := logger.GetGlobalLogger()
		if globalLogger != nil {
			// 创建带上下文的 Logger
			requestLogger := globalLogger.With(
				zap.String("trace_id", traceID),
				zap.String("request_id", requestID),
			)

			// 输出 JSON 格式日志
			requestLogger.Info("HTTP Request",
				zap.String("method", method),
				zap.String("path", path),
				zap.Int("status", statusCode),
				zap.Duration("latency", latency),
				zap.String("client_ip", c.ClientIP()),
				zap.String("user_agent", string(c.UserAgent())),
			)
		} else {
			// 降级为标准日志
			log.Printf("[%s] %s %d %v (trace_id=%s, request_id=%s)",
				method,
				path,
				statusCode,
				latency,
				traceID,
				requestID,
			)
		}

		// 记录 Metrics（如果启用）
		metrics.RecordRequest(method, path, statusCode, latency.Seconds())
	}
}
