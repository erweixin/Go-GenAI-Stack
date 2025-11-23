package handlers

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/model"
	"github.com/erweixin/go-genai-stack/domains/task/repository"
)

// UpdateTaskHandler 更新任务
func (s *HandlerService) UpdateTaskHandler(ctx context.Context, c *app.RequestContext) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "任务 ID 不能为空",
		})
		return
	}

	var req dto.UpdateTaskRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "请求参数无效",
			Details: err.Error(),
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

	// 更新字段
	priority := model.Priority(req.Priority)
	if err := task.Update(req.Title, req.Description, priority); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   errorCode(err),
			Message: err.Error(),
		})
		return
	}

	// 更新截止日期
	if req.DueDate != "" {
		dueDate, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			c.JSON(400, dto.ErrorResponse{
				Error:   "INVALID_DUE_DATE",
				Message: "截止日期格式无效",
			})
			return
		}
		if err := task.SetDueDate(dueDate); err != nil {
			c.JSON(400, dto.ErrorResponse{
				Error:   errorCode(err),
				Message: err.Error(),
			})
			return
		}
	}

	// 更新标签（先清空再添加）
	if req.Tags != nil {
		task.Tags = []model.Tag{}
		for _, tagName := range req.Tags {
			tag := model.Tag{Name: tagName, Color: "#808080"}
			if err := task.AddTag(tag); err != nil {
				c.JSON(400, dto.ErrorResponse{
					Error:   errorCode(err),
					Message: err.Error(),
				})
				return
			}
		}
	}

	if err := s.taskRepo.Update(ctx, task); err != nil {
		log.Printf("Error updating task: %v", err)
		c.JSON(500, dto.ErrorResponse{
			Error:   "UPDATE_FAILED",
			Message: "更新任务失败",
		})
		return
	}

	c.JSON(200, dto.UpdateTaskResponse{
		TaskID:    task.ID,
		Title:     task.Title,
		Status:    string(task.Status),
		UpdatedAt: task.UpdatedAt.Format(time.RFC3339),
	})
}
