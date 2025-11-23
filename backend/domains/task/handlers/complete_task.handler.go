package handlers

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/repository"
)

// CompleteTaskHandler 完成任务
//
// 用例：CompleteTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: POST
//   - Path: /api/tasks/:id/complete
func (s *HandlerService) CompleteTaskHandler(ctx context.Context, c *app.RequestContext) {
	// 获取任务 ID
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

	// Step 1: GetTask - 获取任务
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		if err == repository.ErrTaskNotFound {
			c.JSON(404, dto.ErrorResponse{
				Error:   "TASK_NOT_FOUND",
				Message: "任务不存在",
			})
		} else {
			log.Printf("Error finding task: %v", err)
			c.JSON(500, dto.ErrorResponse{
				Error:   "QUERY_FAILED",
				Message: "查询任务失败",
			})
		}
		return
	}

	// Step 2 & 3: MarkAsCompleted + RecordCompletionTime
	if err := task.Complete(); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   errorCode(err),
			Message: err.Error(),
		})
		return
	}

	// Step 4: SaveTask
	if err := s.taskRepo.Update(ctx, task); err != nil {
		log.Printf("Error updating task: %v", err)
		c.JSON(500, dto.ErrorResponse{
			Error:   "UPDATE_FAILED",
			Message: "更新任务失败",
		})
		return
	}

	// Step 5: PublishTaskCompletedEvent
	// Extension point: 发布事件
	log.Printf("Task completed: %s", task.ID)

	// 返回响应
	c.JSON(200, dto.CompleteTaskResponse{
		TaskID:      task.ID,
		Status:      string(task.Status),
		CompletedAt: task.CompletedAt.Format(time.RFC3339),
	})
}

