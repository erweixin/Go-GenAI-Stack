package service

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/erweixin/go-genai-stack/domains/task/model"
	"github.com/erweixin/go-genai-stack/domains/task/repository"
)

// TaskService 任务领域服务
//
// 职责：
// - 封装任务领域的业务逻辑
// - 协调多个实体和仓储
// - 实现复杂的业务流程
// - 发布领域事件
//
// 与 Handler 的区别：
// - Handler：HTTP 适配层，薄层，只做请求/响应转换
// - Service：业务逻辑层，厚层，实现领域用例
type TaskService struct {
	taskRepo repository.TaskRepository
	// Extension point: 添加更多依赖
	// eventBus events.EventBus
	// cache    cache.Cache
}

// NewTaskService 创建任务领域服务
//
// 参数：
//   - taskRepo: 任务仓储
//
// 返回：
//   - *TaskService: 任务领域服务实例
func NewTaskService(taskRepo repository.TaskRepository) *TaskService {
	return &TaskService{
		taskRepo: taskRepo,
	}
}

// CreateTaskInput 创建任务输入（领域层 DTO）
//
// 与 HTTP DTO 的区别：
// - HTTP DTO：贴近 API 规范，包含 json tag、validation tag
// - Domain Input：纯业务概念，不包含技术细节
type CreateTaskInput struct {
	Title       string
	Description string
	Priority    model.Priority
	DueDate     *time.Time
	Tags        []string
}

// CreateTaskOutput 创建任务输出
type CreateTaskOutput struct {
	Task *model.Task
}

// CreateTask 创建任务（用例实现）
//
// 对应 usecases.yaml 中的 CreateTask
//
// 步骤：
//  1. ValidateInput - 验证输入参数
//  2. GenerateTaskID - 生成唯一的任务 ID
//  3. CreateTaskEntity - 创建任务实体
//  4. SaveTask - 保存任务到数据库
//  5. PublishTaskCreatedEvent - 发布任务创建事件
//
// 业务规则（参考 rules.md）：
// - 任务标题不能为空
// - 优先级必须是 low/medium/high
// - 截止日期不能早于当前时间
// - 标签最多 10 个
func (s *TaskService) CreateTask(ctx context.Context, input CreateTaskInput) (*CreateTaskOutput, error) {
	// Step 1: ValidateInput - 业务规则验证
	if input.Title == "" {
		return nil, fmt.Errorf("TASK_TITLE_EMPTY: 任务标题不能为空")
	}

	// Step 2 & 3: CreateTaskEntity - 创建任务实体
	priority := input.Priority
	if priority == "" {
		priority = model.PriorityMedium // 默认优先级
	}

	task, err := model.NewTask(input.Title, input.Description, priority)
	if err != nil {
		return nil, err // 直接返回 Model 层的错误（已经包含错误码）
	}

	// 设置截止日期
	if input.DueDate != nil {
		if err := task.SetDueDate(*input.DueDate); err != nil {
			return nil, err // 直接返回 Model 层的错误
		}
	}

	// 添加标签
	if len(input.Tags) > 10 {
		return nil, fmt.Errorf("TOO_MANY_TAGS: 标签过多，最多 10 个")
	}

	for _, tagName := range input.Tags {
		tag := model.Tag{
			Name:  tagName,
			Color: "#808080", // 默认颜色
		}
		if err := task.AddTag(tag); err != nil {
			return nil, fmt.Errorf("添加标签失败: %w", err)
		}
	}

	// Step 4: SaveTask - 保存任务
	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, fmt.Errorf("CREATION_FAILED: 保存任务失败: %w", err)
	}

	// Step 5: PublishTaskCreatedEvent
	// Extension point: 发布事件到事件总线
	// s.eventBus.Publish(ctx, &events.TaskCreatedEvent{
	//     TaskID:    task.ID,
	//     Title:     task.Title,
	//     Priority:  string(task.Priority),
	//     CreatedAt: task.CreatedAt,
	// })
	log.Printf("Task created: %s", task.ID)

	return &CreateTaskOutput{Task: task}, nil
}

// UpdateTaskInput 更新任务输入
type UpdateTaskInput struct {
	TaskID      string
	Title       *string
	Description *string
	Priority    *model.Priority
	DueDate     *time.Time
	Tags        []string
}

// UpdateTaskOutput 更新任务输出
type UpdateTaskOutput struct {
	Task *model.Task
}

// UpdateTask 更新任务（用例实现）
//
// 对应 usecases.yaml 中的 UpdateTask
//
// 步骤：
//  1. ValidateInput
//  2. GetTask - 获取任务
//  3. CheckIfCompleted - 检查任务是否已完成
//  4. UpdateTaskFields - 更新任务字段
//  5. SaveTask - 保存任务
//  6. PublishTaskUpdatedEvent
//
// 业务规则：
// - 任务必须存在
// - 已完成的任务不能更新
func (s *TaskService) UpdateTask(ctx context.Context, input UpdateTaskInput) (*UpdateTaskOutput, error) {
	// Step 2: GetTask
	task, err := s.taskRepo.FindByID(ctx, input.TaskID)
	if err != nil {
		return nil, fmt.Errorf("TASK_NOT_FOUND: 任务不存在")
	}

	// Step 3: CheckIfCompleted
	if task.Status == model.StatusCompleted {
		return nil, fmt.Errorf("TASK_ALREADY_COMPLETED: 已完成的任务不能更新")
	}

	// Step 4: UpdateTaskFields
	if input.Title != nil && *input.Title != "" {
		task.Title = *input.Title
	}

	if input.Description != nil {
		task.Description = *input.Description
	}

	if input.Priority != nil {
		if !isValidPriority(*input.Priority) {
			return nil, fmt.Errorf("INVALID_PRIORITY: 优先级无效")
		}
		task.Priority = *input.Priority
	}

	if input.DueDate != nil {
		if err := task.SetDueDate(*input.DueDate); err != nil {
			return nil, fmt.Errorf("设置截止日期失败: %w", err)
		}
	}

	// 更新标签（如果提供）
	if input.Tags != nil {
		// 清空现有标签
		task.Tags = []model.Tag{}
		// 添加新标签
		for _, tagName := range input.Tags {
			tag := model.Tag{Name: tagName, Color: "#808080"}
			if err := task.AddTag(tag); err != nil {
				return nil, err
			}
		}
	}

	// 更新时间戳
	task.UpdatedAt = time.Now()

	// Step 5: SaveTask
	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, fmt.Errorf("UPDATE_FAILED: 更新任务失败")
	}

	// Step 6: PublishTaskUpdatedEvent
	// Extension point: 发布事件
	log.Printf("Task updated: %s", task.ID)

	return &UpdateTaskOutput{Task: task}, nil
}

// CompleteTask 完成任务（用例实现）
//
// 对应 usecases.yaml 中的 CompleteTask
//
// 步骤：
//  1. GetTask
//  2. CheckStatus
//  3. MarkAsCompleted
//  4. RecordCompletionTime
//  5. SaveTask
//  6. PublishTaskCompletedEvent
func (s *TaskService) CompleteTask(ctx context.Context, taskID string) (*model.Task, error) {
	// Step 1: GetTask
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return nil, fmt.Errorf("TASK_NOT_FOUND: 任务不存在")
	}

	// Step 2 & 3: CheckStatus & MarkAsCompleted
	if err := task.Complete(); err != nil {
		return nil, err
	}

	// Step 4: RecordCompletionTime（已在 task.Complete() 中完成）

	// Step 5: SaveTask
	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, fmt.Errorf("COMPLETION_FAILED: 完成任务失败")
	}

	// Step 6: PublishTaskCompletedEvent
	// Extension point: 发布事件
	log.Printf("Task completed: %s", task.ID)

	return task, nil
}

// DeleteTask 删除任务（用例实现）
//
// 对应 usecases.yaml 中的 DeleteTask
func (s *TaskService) DeleteTask(ctx context.Context, taskID string) error {
	// Step 1: GetTask - 确认任务存在
	_, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return fmt.Errorf("TASK_NOT_FOUND: 任务不存在")
	}

	// Step 2: DeleteTaskRecord
	if err := s.taskRepo.Delete(ctx, taskID); err != nil {
		return fmt.Errorf("DELETION_FAILED: 删除任务失败")
	}

	// Step 3: PublishTaskDeletedEvent
	// Extension point: 发布事件
	log.Printf("Task deleted: %s", taskID)

	return nil
}

// GetTask 获取任务详情（用例实现）
//
// 对应 usecases.yaml 中的 GetTask
func (s *TaskService) GetTask(ctx context.Context, taskID string) (*model.Task, error) {
	task, err := s.taskRepo.FindByID(ctx, taskID)
	if err != nil {
		return nil, fmt.Errorf("TASK_NOT_FOUND: 任务不存在")
	}
	return task, nil
}

// ListTasksInput 列出任务输入
type ListTasksInput struct {
	Filter repository.TaskFilter
}

// ListTasksOutput 列出任务输出
type ListTasksOutput struct {
	Tasks      []*model.Task
	TotalCount int
	Page       int
	Limit      int
	HasMore    bool
}

// ListTasks 列出任务（用例实现）
//
// 对应 usecases.yaml 中的 ListTasks
func (s *TaskService) ListTasks(ctx context.Context, input ListTasksInput) (*ListTasksOutput, error) {
	// Step 1: ValidateQueryParams（已在 Filter 构建时完成）

	// Step 2 & 3: QueryTasks + CountTotalTasks
	// Repository.List 返回任务列表和总数
	tasks, totalCount, err := s.taskRepo.List(ctx, &input.Filter)
	if err != nil {
		return nil, fmt.Errorf("QUERY_FAILED: 查询失败")
	}

	// Step 4: FormatResponse
	hasMore := (input.Filter.Page * input.Filter.Limit) < totalCount

	return &ListTasksOutput{
		Tasks:      tasks,
		TotalCount: totalCount,
		Page:       input.Filter.Page,
		Limit:      input.Filter.Limit,
		HasMore:    hasMore,
	}, nil
}

// isValidPriority 验证优先级是否有效
func isValidPriority(p model.Priority) bool {
	return p == model.PriorityLow || p == model.PriorityMedium || p == model.PriorityHigh
}
