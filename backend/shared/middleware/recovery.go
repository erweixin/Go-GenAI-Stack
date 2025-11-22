package middleware

import (
	"context"
	"log"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
)

// Recovery panic 恢复中间件
func Recovery() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC: %v", err)

				c.JSON(consts.StatusInternalServerError, map[string]interface{}{
					"error":   "INTERNAL_ERROR",
					"message": "内部服务器错误",
				})

				c.Abort()
			}
		}()

		c.Next(ctx)
	}
}
