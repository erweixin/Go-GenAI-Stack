package handlers

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
)

// DeleteTaskHandler 删除任务
func (s *HandlerService) DeleteTaskHandler(ctx context.Context, c *app.RequestContext) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

	// 检查任务是否存在
	exists, err := s.taskRepo.Exists(ctx, taskID)
	if err != nil {
		log.Printf("Error checking task existence: %v", err)
		c.JSON(500, dto.ErrorResponse{
			Error:   "QUERY_FAILED",
			Message: "查询任务失败",
		})
		return
	}
	if !exists {
		c.JSON(404, dto.ErrorResponse{
			Error:   "TASK_NOT_FOUND",
			Message: "任务不存在",
		})
		return
	}

	// 删除任务
	if err := s.taskRepo.Delete(ctx, taskID); err != nil {
		log.Printf("Error deleting task: %v", err)
		c.JSON(500, dto.ErrorResponse{
			Error:   "DELETION_FAILED",
			Message: "删除任务失败",
		})
		return
	}

	// Extension point: 发布事件
	log.Printf("Task deleted: %s", taskID)

	c.JSON(200, dto.DeleteTaskResponse{
		Success:   true,
		DeletedAt: time.Now().Format(time.RFC3339),
	})
}

