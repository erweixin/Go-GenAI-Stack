package middleware

import (
	"context"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/google/uuid"
)

// TracingMiddleware 分布式追踪中间件
//
// 为每个请求生成唯一的 Trace ID 和 Request ID
type TracingMiddleware struct {
	// TODO: 集成 OpenTelemetry
}

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
		// 生成 Request ID
		requestID := uuid.New().String()
		c.Set("request_id", requestID)
		c.Header("X-Request-ID", requestID)

		// 获取或生成 Trace ID
		traceID := string(c.GetHeader("X-Trace-ID"))
		if traceID == "" {
			traceID = uuid.New().String()
		}
		c.Set("trace_id", traceID)
		c.Header("X-Trace-ID", traceID)

		// 记录开始时间
		startTime := time.Now()
		c.Set("start_time", startTime)

		// 继续处理请求
		c.Next(ctx)

		// 计算请求耗时
		duration := time.Since(startTime)
		c.Header("X-Response-Time", duration.String())

		// TODO: 发送追踪数据到 OpenTelemetry Collector
		// span := trace.SpanFromContext(ctx)
		// span.SetAttributes(
		//     attribute.String("http.method", string(c.Method())),
		//     attribute.String("http.url", string(c.Request.URI().RequestURI())),
		//     attribute.Int("http.status_code", c.Response.StatusCode()),
		// )
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

