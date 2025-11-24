package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/tracing"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

// TracingMiddleware 分布式追踪中间件
//
// 功能：
//   - 生成唯一的 Trace ID 和 Request ID
//   - 如果启用了 OpenTelemetry，创建 HTTP Span
//   - 支持跨服务 Trace 上下文传播
type TracingMiddleware struct{}

// NewTracingMiddleware 创建追踪中间件
func NewTracingMiddleware() *TracingMiddleware {
	return &TracingMiddleware{}
}

// Handle 处理追踪
//
// Example:
//
//	tracingMW := NewTracingMiddleware()
//	router.Use(tracingMW.Handle())
func (m *TracingMiddleware) Handle() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		// 1. 生成 Request ID
		requestID := uuid.New().String()
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		// 2. 提取 Trace 上下文（如果存在）
		globalTracer := tracing.GetGlobalTracer()
		if globalTracer != nil && globalTracer.IsEnabled() {
			// 从 Headers 提取上下文
			headers := make(map[string][]string)
			c.Request.Header.VisitAll(func(key, value []byte) {
				headers[string(key)] = []string{string(value)}
			})
			ctx = tracing.ExtractFromHeaders(ctx, headers)

			// 3. 开始 HTTP Span
			ctx, span := tracing.StartHTTPSpan(ctx,
				string(c.Method()),
				string(c.Path()),
			)
			defer span.End()

			// 4. 获取 TraceID（从 OpenTelemetry Span）
			spanContext := span.SpanContext()
			traceID := spanContext.TraceID().String()
			c.Set("trace_id", traceID)
			c.Header("X-Trace-ID", traceID)

			// 5. 添加通用属性
			span.SetAttributes(
				attribute.String("http.client_ip", c.ClientIP()),
				attribute.String("http.user_agent", string(c.UserAgent())),
				attribute.String("request_id", requestID),
			)

			// 6. 记录开始时间
			startTime := time.Now()
			c.Set("start_time", startTime)

			// 7. 处理请求
			c.Next(ctx)

			// 8. 记录响应属性
			duration := time.Since(startTime)
			statusCode := c.Response.StatusCode()

			span.SetAttributes(
				attribute.Int("http.status_code", statusCode),
				attribute.Int64("http.response_size", int64(c.Response.Header.ContentLength())),
			)
			c.Header("X-Response-Time", duration.String())

			// 9. 记录错误（如果状态码 >= 400）
			if statusCode >= 400 {
				span.SetStatus(codes.Error, fmt.Sprintf("HTTP %d", statusCode))
			} else {
				span.SetStatus(codes.Ok, "")
			}
		} else {
			// 降级为简单的 TraceID 生成（不启用 OpenTelemetry）
			traceID := string(c.GetHeader("X-Trace-ID"))
			if traceID == "" {
				traceID = uuid.New().String()
			}
			c.Set("trace_id", traceID)
			c.Header("X-Trace-ID", traceID)

			// 记录开始时间
			startTime := time.Now()
			c.Set("start_time", startTime)

			// 处理请求
			c.Next(ctx)

			// 计算请求耗时
			duration := time.Since(startTime)
			c.Header("X-Response-Time", duration.String())
		}
	}
}

// GetRequestID 从上下文中获取 Request ID
func GetRequestID(c *app.RequestContext) string {
	requestID, exists := c.Get("request_id")
	if !exists {
		return ""
	}

	requestIDStr, _ := requestID.(string)
	return requestIDStr
}

// GetTraceID 从上下文中获取 Trace ID
func GetTraceID(c *app.RequestContext) string {
	traceID, exists := c.Get("trace_id")
	if !exists {
		return ""
	}

	traceIDStr, _ := traceID.(string)
	return traceIDStr
}

// GetStartTime 从上下文中获取请求开始时间
func GetStartTime(c *app.RequestContext) time.Time {
	startTime, exists := c.Get("start_time")
	if !exists {
		return time.Now()
	}

	startTimeVal, _ := startTime.(time.Time)
	return startTimeVal
}

// GetDuration 获取请求持续时间
func GetDuration(c *app.RequestContext) time.Duration {
	startTime := GetStartTime(c)
	return time.Since(startTime)
}
