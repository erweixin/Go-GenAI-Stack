package middleware

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
)

// Logger 请求日志中间件
func Logger() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		start := time.Now()
		path := string(c.Path())
		method := string(c.Method())

		c.Next(ctx)

		latency := time.Since(start)
		statusCode := c.Response.StatusCode()

		log.Printf("[%s] %s %d %v",
			method,
			path,
			statusCode,
			latency,
		)
	}
}
