package handlers

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/model"
)

// CreateTaskHandler 创建任务
//
// 用例：CreateTask（参考 usecases.yaml）
//
// HTTP:
//   - Method: POST
//   - Path: /api/tasks
//
// 输入：
//   - title: 任务标题（必填）
//   - description: 任务描述（可选）
//   - priority: 优先级（可选，默认 medium）
//   - due_date: 截止日期（可选）
//   - tags: 标签列表（可选）
//
// 输出：
//   - task_id: 任务 ID
//   - title: 任务标题
//   - status: 任务状态
//   - created_at: 创建时间
//
// 步骤：
//  1. ValidateInput - 验证输入参数
//  2. GenerateTaskID - 生成唯一的任务 ID
//  3. CreateTaskEntity - 创建任务实体
//  4. SaveTask - 保存任务到数据库
//  5. PublishTaskCreatedEvent - 发布任务创建事件
//
// 错误：
//   - TASK_TITLE_EMPTY: 任务标题不能为空
//   - INVALID_PRIORITY: 优先级无效
//   - INVALID_DUE_DATE: 截止日期无效
//   - TOO_MANY_TAGS: 标签过多
//   - CREATION_FAILED: 创建任务失败
func (s *HandlerService) CreateTaskHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: ValidateInput - 解析并验证请求
	var req dto.CreateTaskRequest
	if err := c.BindAndValidate(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_INPUT",
			Message: "请求参数无效",
			Details: err.Error(),
		})
		return
	}

	// Step 2 & 3: CreateTaskEntity - 创建任务实体
	priority := model.Priority(req.Priority)
	if priority == "" {
		priority = model.PriorityMedium
	}

	task, err := model.NewTask(req.Title, req.Description, priority)
	if err != nil {
		// 处理领域错误
		c.JSON(400, dto.ErrorResponse{
			Error:   errorCode(err),
			Message: err.Error(),
		})
		return
	}

	// 设置截止日期
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

	// 添加标签
	for _, tagName := range req.Tags {
		tag := model.Tag{
			Name:  tagName,
			Color: "#808080", // 默认颜色
		}
		if err := task.AddTag(tag); err != nil {
			c.JSON(400, dto.ErrorResponse{
				Error:   errorCode(err),
				Message: err.Error(),
			})
			return
		}
	}

	// Step 4: SaveTask - 保存任务
	if err := s.taskRepo.Create(ctx, task); err != nil {
		log.Printf("Error creating task: %v", err)
		c.JSON(500, dto.ErrorResponse{
			Error:   "CREATION_FAILED",
			Message: "创建任务失败",
		})
		return
	}

	// Step 5: PublishTaskCreatedEvent
	// Extension point: 发布事件到事件总线
	// eventBus.Publish(ctx, &events.TaskCreatedEvent{...})
	log.Printf("Task created: %s", task.ID)

	// 返回响应
	c.JSON(200, dto.CreateTaskResponse{
		TaskID:    task.ID,
		Title:     task.Title,
		Status:    string(task.Status),
		CreatedAt: task.CreatedAt.Format(time.RFC3339),
	})
}
