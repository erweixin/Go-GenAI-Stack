package tests

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/stretchr/testify/assert"
)

// TestUpdateTask_Success 测试成功更新任务
func TestUpdateTask_Success(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询任务
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority", "due_date", "created_at", "updated_at", "completed_at",
	}).AddRow("task-123", "Old Title", "Old Description", "pending", "low", nil, time.Now(), time.Now(), nil)

	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnRows(rows)

	// Mock 加载 tags
	tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"})
	helper.Mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnRows(tagsRows)

	// Mock 更新任务（先更新任务）
	helper.Mock.ExpectExec("UPDATE tasks SET (.+) WHERE id").
		WithArgs(
			"New Title",       // title
			"New Description", // description
			sqlmock.AnyArg(),  // status
			"high",            // priority
			sqlmock.AnyArg(),  // due_date
			sqlmock.AnyArg(),  // updated_at
			sqlmock.AnyArg(),  // completed_at
			"task-123",        // id
		).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock 删除旧 tags（在更新任务后）
	helper.Mock.ExpectExec("DELETE FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnResult(sqlmock.NewResult(0, 0))

	// 注册路由
	helper.RegisterRoute("PUT", "/api/tasks/:id", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.UpdateTaskHandler(ctx, c)
	})

	// 准备请求
	req := dto.UpdateTaskRequest{
		Title:       "New Title",
		Description: "New Description",
		Priority:    "high",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("PUT", "/api/tasks/task-123",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusOK, w.Code)

	helper.AssertExpectations(t)
}

// TestUpdateTask_TASK_NOT_FOUND 测试更新不存在的任务
//
// 对应 usecases.yaml 中的错误：TASK_NOT_FOUND
// 错误消息："任务不存在"
// HTTP 状态码：404
func TestUpdateTask_TASK_NOT_FOUND(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询返回空结果
	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("nonexistent").
		WillReturnError(sql.ErrNoRows)

	// 注册路由
	helper.RegisterRoute("PUT", "/api/tasks/:id", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.UpdateTaskHandler(ctx, c)
	})

	req := dto.UpdateTaskRequest{
		Title: "New Title",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("PUT", "/api/tasks/nonexistent",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusNotFound, w.Code)

	helper.AssertExpectations(t)
}

// TestUpdateTask_TASK_ALREADY_COMPLETED 测试更新已完成的任务
//
// 对应 usecases.yaml 中的错误：TASK_ALREADY_COMPLETED
// 错误消息："已完成的任务不能更新"
// HTTP 状态码：400
func TestUpdateTask_TASK_ALREADY_COMPLETED(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询任务（已完成状态）
	completedAt := time.Now()
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority", "due_date", "created_at", "updated_at", "completed_at",
	}).AddRow("task-123", "Test Task", "Description", "completed", "medium", nil, time.Now(), time.Now(), &completedAt)

	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnRows(rows)

	// Mock 加载 tags
	tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"})
	helper.Mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnRows(tagsRows)

	// 注册路由
	helper.RegisterRoute("PUT", "/api/tasks/:id", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.UpdateTaskHandler(ctx, c)
	})

	req := dto.UpdateTaskRequest{
		Title: "New Title",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("PUT", "/api/tasks/task-123",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusBadRequest, w.Code)

	var errResp dto.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "ALREADY_COMPLETED")

	helper.AssertExpectations(t)
}

// TestUpdateTask_INVALID_PRIORITY 测试无效的优先级
//
// 对应 usecases.yaml 中的错误：INVALID_PRIORITY
// 错误消息："优先级无效"
// HTTP 状态码：400
func TestUpdateTask_INVALID_PRIORITY(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询任务
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority", "due_date", "created_at", "updated_at", "completed_at",
	}).AddRow("task-123", "Test Task", "Description", "pending", "medium", nil, time.Now(), time.Now(), nil)

	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnRows(rows)

	// Mock 加载 tags
	tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"})
	helper.Mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnRows(tagsRows)

	// 注册路由
	helper.RegisterRoute("PUT", "/api/tasks/:id", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.UpdateTaskHandler(ctx, c)
	})

	// 准备请求（无效的优先级）
	req := dto.UpdateTaskRequest{
		Priority: "urgent", // 无效值
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("PUT", "/api/tasks/task-123",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusBadRequest, w.Code)

	helper.AssertExpectations(t)
}

// TestUpdateTask_UPDATE_FAILED 测试更新失败
//
// 对应 usecases.yaml 中的错误：UPDATE_FAILED
// 错误消息："更新任务失败"
// HTTP 状态码：500
func TestUpdateTask_UPDATE_FAILED(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询成功
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority", "due_date", "created_at", "updated_at", "completed_at",
	}).AddRow("task-123", "Old Title", "Description", "pending", "medium", nil, time.Now(), time.Now(), nil)

	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnRows(rows)

	// Mock 加载 tags
	tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"})
	helper.Mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnRows(tagsRows)

	// Mock 更新失败（先尝试更新任务）
	helper.Mock.ExpectExec("UPDATE tasks SET (.+) WHERE id").
		WillReturnError(sql.ErrConnDone)

	// 注册路由
	helper.RegisterRoute("PUT", "/api/tasks/:id", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.UpdateTaskHandler(ctx, c)
	})

	req := dto.UpdateTaskRequest{
		Title:       "New Title",
		Description: "Description",
		Priority:    "medium",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("PUT", "/api/tasks/task-123",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusInternalServerError, w.Code)

	helper.AssertExpectations(t)
}
