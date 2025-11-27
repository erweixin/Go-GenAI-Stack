package handlers

import (
	"testing"
	"time"

	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
	"github.com/erweixin/go-genai-stack/backend/domains/task/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ========================================
// CreateTask 转换测试
// ========================================

func TestToCreateTaskInput(t *testing.T) {
	t.Run("转换成功_无可选字段", func(t *testing.T) {
		userID := "user-123"
		req := dto.CreateTaskRequest{
			Title:       "Test Task",
			Description: "Test Description",
			Priority:    "high",
			Tags:        []string{"tag1", "tag2"},
		}

		input, err := toCreateTaskInput(userID, req)

		require.NoError(t, err)
		assert.Equal(t, userID, input.UserID)
		assert.Equal(t, "Test Task", input.Title)
		assert.Equal(t, "Test Description", input.Description)
		assert.Equal(t, model.PriorityHigh, input.Priority)
		assert.Equal(t, []string{"tag1", "tag2"}, input.Tags)
		assert.Nil(t, input.DueDate)
	})

	t.Run("转换成功_包含截止日期", func(t *testing.T) {
		userID := "user-123"
		dueDate := "2024-12-31T23:59:59Z"
		req := dto.CreateTaskRequest{
			Title:       "Test Task",
			Description: "Test Description",
			Priority:    "medium",
			DueDate:     dueDate,
		}

		input, err := toCreateTaskInput(userID, req)

		require.NoError(t, err)
		assert.NotNil(t, input.DueDate)
		assert.Equal(t, "2024-12-31T23:59:59Z", input.DueDate.Format(time.RFC3339))
	})

	t.Run("无效的截止日期格式", func(t *testing.T) {
		userID := "user-123"
		req := dto.CreateTaskRequest{
			Title:    "Test Task",
			Priority: "low",
			DueDate:  "invalid-date",
		}

		_, err := toCreateTaskInput(userID, req)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "INVALID_DUE_DATE")
	})
}

func TestToCreateTaskResponse(t *testing.T) {
	now := time.Now()
	task := &model.Task{
		ID:        "task-123",
		Title:     "Test Task",
		Status:    model.StatusPending,
		CreatedAt: now,
	}

	output := &service.CreateTaskOutput{
		Task: task,
	}

	resp := toCreateTaskResponse(output)

	assert.Equal(t, "task-123", resp.TaskID)
	assert.Equal(t, "Test Task", resp.Title)
	assert.Equal(t, "pending", resp.Status)
	assert.Equal(t, now.Format(time.RFC3339), resp.CreatedAt)
}

// ========================================
// UpdateTask 转换测试
// ========================================

func TestToUpdateTaskInput(t *testing.T) {
	t.Run("转换成功_所有字段", func(t *testing.T) {
		userID := "user-123"
		taskID := "task-456"
		req := dto.UpdateTaskRequest{
			Title:       "Updated Title",
			Description: "Updated Description",
			Priority:    "high",
			DueDate:     "2024-12-31T23:59:59Z",
			Tags:        []string{"tag1", "tag2"},
		}

		input, err := toUpdateTaskInput(userID, taskID, req)

		require.NoError(t, err)
		assert.Equal(t, userID, input.UserID)
		assert.Equal(t, taskID, input.TaskID)
		assert.NotNil(t, input.Title)
		assert.Equal(t, "Updated Title", *input.Title)
		assert.NotNil(t, input.Description)
		assert.Equal(t, "Updated Description", *input.Description)
		assert.NotNil(t, input.Priority)
		assert.Equal(t, model.PriorityHigh, *input.Priority)
		assert.NotNil(t, input.DueDate)
		assert.Equal(t, []string{"tag1", "tag2"}, input.Tags)
	})

	t.Run("转换成功_仅部分字段", func(t *testing.T) {
		userID := "user-123"
		taskID := "task-456"
		req := dto.UpdateTaskRequest{
			Title:    "Updated Title",
			Priority: "low",
		}

		input, err := toUpdateTaskInput(userID, taskID, req)

		require.NoError(t, err)
		assert.NotNil(t, input.Title)
		assert.Equal(t, "Updated Title", *input.Title)
		assert.Nil(t, input.Description)
		assert.NotNil(t, input.Priority)
		assert.Equal(t, model.PriorityLow, *input.Priority)
		assert.Nil(t, input.DueDate)
	})

	t.Run("无效的截止日期格式", func(t *testing.T) {
		userID := "user-123"
		taskID := "task-456"
		req := dto.UpdateTaskRequest{
			DueDate: "invalid-date",
		}

		_, err := toUpdateTaskInput(userID, taskID, req)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "INVALID_DUE_DATE")
	})
}

func TestToUpdateTaskResponse(t *testing.T) {
	now := time.Now()
	task := &model.Task{
		ID:        "task-123",
		Title:     "Updated Task",
		Status:    model.StatusPending,
		UpdatedAt: now,
	}

	output := &service.UpdateTaskOutput{
		Task: task,
	}

	resp := toUpdateTaskResponse(output)

	assert.Equal(t, "task-123", resp.TaskID)
	assert.Equal(t, "Updated Task", resp.Title)
	assert.Equal(t, "pending", resp.Status)
	assert.Equal(t, now.Format(time.RFC3339), resp.UpdatedAt)
}

// ========================================
// CompleteTask 转换测试
// ========================================

func TestToCompleteTaskInput(t *testing.T) {
	userID := "user-123"
	taskID := "task-456"

	input := toCompleteTaskInput(userID, taskID)

	assert.Equal(t, userID, input.UserID)
	assert.Equal(t, taskID, input.TaskID)
}

func TestToCompleteTaskResponse(t *testing.T) {
	now := time.Now()
	task := &model.Task{
		ID:          "task-123",
		Status:      model.StatusCompleted,
		CompletedAt: &now,
	}

	output := &service.CompleteTaskOutput{
		Task: task,
	}

	resp := toCompleteTaskResponse(output)

	assert.Equal(t, "task-123", resp.TaskID)
	assert.Equal(t, "completed", resp.Status)
	assert.Equal(t, now.Format(time.RFC3339), resp.CompletedAt)
}

// ========================================
// DeleteTask 转换测试
// ========================================

func TestToDeleteTaskInput(t *testing.T) {
	userID := "user-123"
	taskID := "task-456"

	input := toDeleteTaskInput(userID, taskID)

	assert.Equal(t, userID, input.UserID)
	assert.Equal(t, taskID, input.TaskID)
}

func TestToDeleteTaskResponse(t *testing.T) {
	now := time.Now()
	output := &service.DeleteTaskOutput{
		Success:   true,
		DeletedAt: now,
	}

	resp := toDeleteTaskResponse(output)

	assert.True(t, resp.Success)
	assert.Equal(t, now.Format(time.RFC3339), resp.DeletedAt)
}

// ========================================
// GetTask 转换测试
// ========================================

func TestToGetTaskInput(t *testing.T) {
	userID := "user-123"
	taskID := "task-456"

	input := toGetTaskInput(userID, taskID)

	assert.Equal(t, userID, input.UserID)
	assert.Equal(t, taskID, input.TaskID)
}

func TestToGetTaskResponse(t *testing.T) {
	now := time.Now()
	dueDate := now.Add(24 * time.Hour)
	completedAt := now.Add(-24 * time.Hour)

	task := &model.Task{
		ID:          "task-123",
		Title:       "Test Task",
		Description: "Test Description",
		Status:      model.StatusCompleted,
		Priority:    model.PriorityHigh,
		DueDate:     &dueDate,
		CompletedAt: &completedAt,
		CreatedAt:   now,
		UpdatedAt:   now,
		Tags: []model.Tag{
			{Name: "tag1", Color: "#ff0000"},
			{Name: "tag2", Color: "#00ff00"},
		},
	}

	output := &service.GetTaskOutput{
		Task: task,
	}

	resp := toGetTaskResponse(output)

	assert.Equal(t, "task-123", resp.TaskID)
	assert.Equal(t, "Test Task", resp.Title)
	assert.Equal(t, "Test Description", resp.Description)
	assert.Equal(t, "completed", resp.Status)
	assert.Equal(t, "high", resp.Priority)
	assert.NotNil(t, resp.DueDate)
	assert.Equal(t, dueDate.Format(time.RFC3339), *resp.DueDate)
	assert.NotNil(t, resp.CompletedAt)
	assert.Equal(t, completedAt.Format(time.RFC3339), *resp.CompletedAt)
	assert.Equal(t, now.Format(time.RFC3339), resp.CreatedAt)
	assert.Equal(t, now.Format(time.RFC3339), resp.UpdatedAt)
	assert.Equal(t, []string{"tag1", "tag2"}, resp.Tags)
}

func TestToGetTaskResponse_无可选字段(t *testing.T) {
	now := time.Now()

	task := &model.Task{
		ID:          "task-123",
		Title:       "Test Task",
		Description: "Test Description",
		Status:      model.StatusPending,
		Priority:    model.PriorityMedium,
		CreatedAt:   now,
		UpdatedAt:   now,
		Tags:        []model.Tag{},
	}

	output := &service.GetTaskOutput{
		Task: task,
	}

	resp := toGetTaskResponse(output)

	assert.Nil(t, resp.DueDate)
	assert.Nil(t, resp.CompletedAt)
	assert.Empty(t, resp.Tags)
}

// ========================================
// ListTasks 转换测试
// ========================================

func TestToListTasksInput(t *testing.T) {
	t.Run("转换成功_所有过滤条件", func(t *testing.T) {
		userID := "user-123"
		req := dto.ListTasksRequest{
			Status:      "pending",
			Priority:    "high",
			Tag:         "urgent",
			DueDateFrom: "2024-01-01",
			DueDateTo:   "2024-12-31",
			Keyword:     "search",
			Page:        2,
			Limit:       50,
			SortBy:      "due_date",
			SortOrder:   "asc",
		}

		input := toListTasksInput(userID, req)

		assert.NotNil(t, input.Filter.UserID)
		assert.Equal(t, userID, *input.Filter.UserID)
		assert.NotNil(t, input.Filter.Status)
		assert.Equal(t, model.StatusPending, *input.Filter.Status)
		assert.NotNil(t, input.Filter.Priority)
		assert.Equal(t, model.PriorityHigh, *input.Filter.Priority)
		assert.NotNil(t, input.Filter.Tag)
		assert.Equal(t, "urgent", *input.Filter.Tag)
		assert.NotNil(t, input.Filter.DueDateFrom)
		assert.Equal(t, "2024-01-01", *input.Filter.DueDateFrom)
		assert.NotNil(t, input.Filter.DueDateTo)
		assert.Equal(t, "2024-12-31", *input.Filter.DueDateTo)
		assert.NotNil(t, input.Filter.Keyword)
		assert.Equal(t, "search", *input.Filter.Keyword)
		assert.Equal(t, 2, input.Filter.Page)
		assert.Equal(t, 50, input.Filter.Limit)
		assert.Equal(t, "due_date", input.Filter.SortBy)
		assert.Equal(t, "asc", input.Filter.SortOrder)
	})

	t.Run("转换成功_最少过滤条件", func(t *testing.T) {
		userID := "user-123"
		req := dto.ListTasksRequest{
			Page:      1,
			Limit:     20,
			SortBy:    "created_at",
			SortOrder: "desc",
		}

		input := toListTasksInput(userID, req)

		assert.NotNil(t, input.Filter.UserID)
		assert.Equal(t, userID, *input.Filter.UserID)
		assert.Nil(t, input.Filter.Status)
		assert.Nil(t, input.Filter.Priority)
		assert.Nil(t, input.Filter.Tag)
		assert.Nil(t, input.Filter.DueDateFrom)
		assert.Nil(t, input.Filter.DueDateTo)
		assert.Nil(t, input.Filter.Keyword)
	})
}

func TestToListTasksResponse(t *testing.T) {
	now := time.Now()
	dueDate := now.Add(24 * time.Hour)

	tasks := []*model.Task{
		{
			ID:        "task-1",
			Title:     "Task 1",
			Status:    model.StatusPending,
			Priority:  model.PriorityHigh,
			DueDate:   &dueDate,
			CreatedAt: now,
			Tags: []model.Tag{
				{Name: "tag1", Color: "#ff0000"},
			},
		},
		{
			ID:        "task-2",
			Title:     "Task 2",
			Status:    model.StatusCompleted,
			Priority:  model.PriorityMedium,
			CreatedAt: now,
			Tags:      []model.Tag{},
		},
	}

	output := &service.ListTasksOutput{
		Tasks:      tasks,
		TotalCount: 2,
		Page:       1,
		Limit:      20,
		HasMore:    false,
	}

	resp := toListTasksResponse(output)

	assert.Len(t, resp.Tasks, 2)
	assert.Equal(t, 2, resp.TotalCount)
	assert.Equal(t, 1, resp.Page)
	assert.Equal(t, 20, resp.Limit)
	assert.False(t, resp.HasMore)

	// 验证第一个任务
	task1 := resp.Tasks[0]
	assert.Equal(t, "task-1", task1.TaskID)
	assert.Equal(t, "Task 1", task1.Title)
	assert.Equal(t, "pending", task1.Status)
	assert.Equal(t, "high", task1.Priority)
	assert.NotNil(t, task1.DueDate)
	assert.Equal(t, dueDate.Format(time.RFC3339), *task1.DueDate)
	assert.Equal(t, []string{"tag1"}, task1.Tags)

	// 验证第二个任务
	task2 := resp.Tasks[1]
	assert.Equal(t, "task-2", task2.TaskID)
	assert.Nil(t, task2.DueDate)
	assert.Empty(t, task2.Tags)
}

