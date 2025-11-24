package bootstrap

import (
	"context"
	"net/http"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	taskhttp "github.com/erweixin/go-genai-stack/domains/task/http"
	"github.com/erweixin/go-genai-stack/infrastructure/monitoring/health"
	"github.com/erweixin/go-genai-stack/infrastructure/monitoring/metrics"
)

// RegisterRoutes 注册所有路由
//
// 负责将各个领域的路由注册到服务器上。
// 每个领域的 HTTP 路由接收对应的 HandlerDependencies。
func RegisterRoutes(h *server.Hertz, container *AppContainer) {
	// 1. 监控端点（无需认证）
	registerMonitoringRoutes(h, container)

	// 2. 业务 API 路由
	api := h.Group("/api")
	{
		// 注册 Task 领域路由
		taskhttp.RegisterRoutes(api, container.TaskHandlerDeps)

		// Extension point: 注册其他领域路由
		// userhttp.RegisterRoutes(api, container.UserHandlerDeps)
		// llmhttp.RegisterRoutes(api, container.LLMHandlerDeps)
		// monitoringhttp.RegisterRoutes(api, container.MonitoringDeps)
	}
}

// registerMonitoringRoutes 注册监控相关路由
func registerMonitoringRoutes(h *server.Hertz, container *AppContainer) {
	// 1. /metrics - Prometheus Metrics
	if metricsInstance := metrics.GetGlobalMetrics(); metricsInstance != nil {
		h.GET("/metrics", func(ctx context.Context, c *app.RequestContext) {
			handler := metricsInstance.GetHandler()

			// 适配 Hertz 和标准 HTTP
			w := &responseWriter{c: c}

			// 创建标准 HTTP 请求（简化版）
			r := &http.Request{
				Method: string(c.Method()),
				Header: make(http.Header),
			}

			// 复制 Headers
			c.Request.Header.VisitAll(func(key, value []byte) {
				r.Header.Add(string(key), string(value))
			})

			handler.ServeHTTP(w, r)
		})
	}

	// 2. /health - 健康检查
	if healthChecker := health.GetGlobalChecker(); healthChecker != nil {
		h.GET("/health", func(ctx context.Context, c *app.RequestContext) {
			result := healthChecker.Check(ctx)

			// 根据健康状态设置 HTTP 状态码
			statusCode := http.StatusOK
			if result.Status == health.StatusDown {
				statusCode = http.StatusServiceUnavailable
			}

			c.JSON(statusCode, result)
		})
	}
}

// responseWriter 适配器，将 Hertz 的 RequestContext 适配为 http.ResponseWriter
type responseWriter struct {
	c *app.RequestContext
}

func (w *responseWriter) Header() http.Header {
	header := make(http.Header)
	w.c.Response.Header.VisitAll(func(key, value []byte) {
		header.Add(string(key), string(value))
	})
	return header
}

func (w *responseWriter) Write(data []byte) (int, error) {
	w.c.Response.AppendBody(data)
	return len(data), nil
}

func (w *responseWriter) WriteHeader(statusCode int) {
	w.c.Response.SetStatusCode(statusCode)
}
