package handlers

import (
	"fmt"
	"time"

	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
	"github.com/erweixin/go-genai-stack/backend/domains/task/repository"
	"github.com/erweixin/go-genai-stack/backend/domains/task/service"
)

// DTO 转换层
//
// 职责：
// - HTTP DTO ↔ Domain Input/Output 的转换
// - 数据格式转换（如时间格式）
// - 简化 Handler 层逻辑
//
// 命名规范：
// - toXxxInput:  HTTP DTO → Domain Input
// - toXxxResponse: Domain Output → HTTP Response

// ========================================
// CreateTask 转换
// ========================================

// toCreateTaskInput 将 HTTP 请求转换为 Domain Input
func toCreateTaskInput(userID string, req dto.CreateTaskRequest) (service.CreateTaskInput, error) {
	input := service.CreateTaskInput{
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Priority:    model.Priority(req.Priority),
		Tags:        req.Tags,
	}

	// 解析截止日期
	if req.DueDate != "" {
		dueDate, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			return input, fmt.Errorf("INVALID_DUE_DATE: 截止日期格式无效")
		}
		input.DueDate = &dueDate
	}

	return input, nil
}

// toCreateTaskResponse 将 Domain Output 转换为 HTTP 响应
func toCreateTaskResponse(output *service.CreateTaskOutput) dto.CreateTaskResponse {
	return dto.CreateTaskResponse{
		TaskID:    output.Task.ID,
		Title:     output.Task.Title,
		Status:    string(output.Task.Status),
		CreatedAt: output.Task.CreatedAt.Format(time.RFC3339),
	}
}

// ========================================
// UpdateTask 转换
// ========================================

// toUpdateTaskInput 将 HTTP 请求转换为 Domain Input
func toUpdateTaskInput(userID, taskID string, req dto.UpdateTaskRequest) (service.UpdateTaskInput, error) {
	input := service.UpdateTaskInput{
		UserID: userID,
		TaskID: taskID,
	}

	// 只设置非空字段
	if req.Title != "" {
		input.Title = &req.Title
	}

	if req.Description != "" {
		input.Description = &req.Description
	}

	if req.Priority != "" {
		priority := model.Priority(req.Priority)
		input.Priority = &priority
	}

	if req.DueDate != "" {
		dueDate, err := time.Parse(time.RFC3339, req.DueDate)
		if err != nil {
			return input, fmt.Errorf("INVALID_DUE_DATE: 截止日期格式无效")
		}
		input.DueDate = &dueDate
	}

	if req.Tags != nil {
		input.Tags = req.Tags
	}

	return input, nil
}

// toUpdateTaskResponse 将 Domain Output 转换为 HTTP 响应
func toUpdateTaskResponse(output *service.UpdateTaskOutput) dto.UpdateTaskResponse {
	return dto.UpdateTaskResponse{
		TaskID:    output.Task.ID,
		Title:     output.Task.Title,
		Status:    string(output.Task.Status),
		UpdatedAt: output.Task.UpdatedAt.Format(time.RFC3339),
	}
}

// ========================================
// CompleteTask 转换
// ========================================

// toCompleteTaskInput 将请求参数转换为 Domain Input
func toCompleteTaskInput(userID, taskID string) service.CompleteTaskInput {
	return service.CompleteTaskInput{
		UserID: userID,
		TaskID: taskID,
	}
}

// toCompleteTaskResponse 将 Domain Output 转换为 HTTP 响应
func toCompleteTaskResponse(output *service.CompleteTaskOutput) dto.CompleteTaskResponse {
	return dto.CompleteTaskResponse{
		TaskID:      output.Task.ID,
		Status:      string(output.Task.Status),
		CompletedAt: output.Task.CompletedAt.Format(time.RFC3339),
	}
}

// ========================================
// DeleteTask 转换
// ========================================

// toDeleteTaskInput 将请求参数转换为 Domain Input
func toDeleteTaskInput(userID, taskID string) service.DeleteTaskInput {
	return service.DeleteTaskInput{
		UserID: userID,
		TaskID: taskID,
	}
}

// toDeleteTaskResponse 将 Domain Output 转换为 HTTP 响应
func toDeleteTaskResponse(output *service.DeleteTaskOutput) dto.DeleteTaskResponse {
	return dto.DeleteTaskResponse{
		Success:   output.Success,
		DeletedAt: output.DeletedAt.Format(time.RFC3339),
	}
}

// ========================================
// GetTask 转换
// ========================================

// toGetTaskInput 将请求参数转换为 Domain Input
func toGetTaskInput(userID, taskID string) service.GetTaskInput {
	return service.GetTaskInput{
		UserID: userID,
		TaskID: taskID,
	}
}

// toGetTaskResponse 将 Domain Output 转换为 HTTP 响应
func toGetTaskResponse(output *service.GetTaskOutput) dto.GetTaskResponse {
	task := output.Task

	resp := dto.GetTaskResponse{
		TaskID:      task.ID,
		Title:       task.Title,
		Description: task.Description,
		Status:      string(task.Status),
		Priority:    string(task.Priority),
		CreatedAt:   task.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   task.UpdatedAt.Format(time.RFC3339),
	}

	// 处理可选字段
	if task.DueDate != nil {
		dueDate := task.DueDate.Format(time.RFC3339)
		resp.DueDate = &dueDate
	}

	if task.CompletedAt != nil {
		completedAt := task.CompletedAt.Format(time.RFC3339)
		resp.CompletedAt = &completedAt
	}

	// 转换标签
	tags := make([]string, len(task.Tags))
	for i, tag := range task.Tags {
		tags[i] = tag.Name
	}
	resp.Tags = tags

	return resp
}

// ========================================
// ListTasks 转换
// ========================================

// toListTasksInput 将 HTTP 请求转换为 Domain Input
//
// 注意：查询参数已经通过 Hertz 的 BindAndValidate 绑定到 req 中
func toListTasksInput(userID string, req dto.ListTasksRequest) service.ListTasksInput {
	// 构建筛选条件
	filter := repository.TaskFilter{
		UserID:    &userID,
		Page:      req.Page,
		Limit:     req.Limit,
		SortBy:    req.SortBy,
		SortOrder: req.SortOrder,
	}

	// 设置可选的筛选条件
	if req.Status != "" {
		status := model.TaskStatus(req.Status)
		filter.Status = &status
	}

	if req.Priority != "" {
		priority := model.Priority(req.Priority)
		filter.Priority = &priority
	}

	if req.Tag != "" {
		filter.Tag = &req.Tag
	}

	if req.DueDateFrom != "" {
		filter.DueDateFrom = &req.DueDateFrom
	}

	if req.DueDateTo != "" {
		filter.DueDateTo = &req.DueDateTo
	}

	if req.Keyword != "" {
		filter.Keyword = &req.Keyword
	}

	return service.ListTasksInput{
		Filter: filter,
	}
}

// toListTasksResponse 将 Domain Output 转换为 HTTP 响应
func toListTasksResponse(output *service.ListTasksOutput) dto.ListTasksResponse {
	// 转换任务列表
	tasks := make([]dto.TaskItem, len(output.Tasks))
	for i, task := range output.Tasks {
		summary := dto.TaskItem{
			TaskID:    task.ID,
			Title:     task.Title,
			Status:    string(task.Status),
			Priority:  string(task.Priority),
			CreatedAt: task.CreatedAt.Format(time.RFC3339),
		}

		// 可选字段
		if task.DueDate != nil {
			dueDate := task.DueDate.Format(time.RFC3339)
			summary.DueDate = &dueDate
		}

		// 标签
		tags := make([]string, len(task.Tags))
		for j, tag := range task.Tags {
			tags[j] = tag.Name
		}
		summary.Tags = tags

		tasks[i] = summary
	}

	return dto.ListTasksResponse{
		Tasks:      tasks,
		TotalCount: output.TotalCount,
		Page:       output.Page,
		Limit:      output.Limit,
		HasMore:    output.HasMore,
	}
}
