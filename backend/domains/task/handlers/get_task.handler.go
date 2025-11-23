package handlers

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/repository"
)

// GetTaskHandler 获取任务详情
func (s *HandlerService) GetTaskHandler(ctx context.Context, c *app.RequestContext) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

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

	// 格式化响应
	resp := dto.GetTaskResponse{
		TaskID:      task.ID,
		Title:       task.Title,
		Description: task.Description,
		Status:      string(task.Status),
		Priority:    string(task.Priority),
		CreatedAt:   task.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   task.UpdatedAt.Format(time.RFC3339),
	}

	if task.DueDate != nil {
		dueDate := task.DueDate.Format(time.RFC3339)
		resp.DueDate = &dueDate
	}

	if task.CompletedAt != nil {
		completedAt := task.CompletedAt.Format(time.RFC3339)
		resp.CompletedAt = &completedAt
	}

	tags := make([]string, len(task.Tags))
	for i, tag := range task.Tags {
		tags[i] = tag.Name
	}
	resp.Tags = tags

	c.JSON(200, resp)
}
