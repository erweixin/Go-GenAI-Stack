package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/domains/chat/http/dto"
)

// StreamMessageHandler 处理流式消息请求
//
// 用例：StreamMessage
// 参考：domains/chat/usecases.yaml
func StreamMessageHandler(ctx context.Context, c *app.RequestContext) {
	var req dto.StreamMessageRequest

	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(consts.StatusBadRequest, map[string]interface{}{
			"error":   "INVALID_REQUEST",
			"message": err.Error(),
		})
		return
	}

	// 设置 SSE 响应头
	c.SetStatusCode(consts.StatusOK)
	c.Response.Header.Set("Content-Type", "text/event-stream")
	c.Response.Header.Set("Cache-Control", "no-cache")
	c.Response.Header.Set("Connection", "keep-alive")

	// TODO: 实际应该调用 LLM Domain 的流式 API
	// 这里模拟流式输出
	words := []string{"这", "是", "一个", "流式", "响应", "的", "示例"}

	for i, word := range words {
		chunk := dto.StreamChunk{
			Content: word,
			Done:    false,
		}

		// 发送 SSE 数据
		c.Write([]byte(fmt.Sprintf("data: {\"content\":\"%s\",\"done\":false}\n\n", chunk.Content)))
		c.Flush()

		// 模拟延迟
		time.Sleep(100 * time.Millisecond)

		if i == len(words)-1 {
			// 最后一个块
			finalChunk := dto.StreamChunk{
				Content:   "",
				Done:      true,
				MessageID: "msg-stream-123",
				Tokens:    len(words),
			}
			c.Write([]byte(fmt.Sprintf("data: {\"content\":\"\",\"done\":true,\"message_id\":\"%s\",\"tokens\":%d}\n\n",
				finalChunk.MessageID, finalChunk.Tokens)))
			c.Flush()
		}
	}
}
