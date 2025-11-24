package tests

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/cloudwego/hertz/pkg/route/param"
	"github.com/erweixin/go-genai-stack/backend/domains/task/http/dto"
	"github.com/stretchr/testify/assert"
)

// TestGetTask_Success 测试成功获取任务
func TestGetTask_Success(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询任务
	createdAt, _ := time.Parse(time.RFC3339, "2025-01-01T00:00:00Z")
	updatedAt, _ := time.Parse(time.RFC3339, "2025-01-01T00:00:00Z")
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority", "due_date", "created_at", "updated_at", "completed_at",
	}).AddRow(
		"task-123",
		"Test Task",
		"Test Description",
		"pending",
		"medium",
		nil,
		createdAt,
		updatedAt,
		nil,
	)

	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnRows(rows)

	// Mock 加载 tags
	tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"})
	helper.Mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnRows(tagsRows)

	// 创建 HTTP 上下文
	c := app.NewContext(0)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "task-123"})

	// 执行 Handler
	helper.HandlerDeps.GetTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusOK, c.Response.StatusCode())

	var resp dto.GetTaskResponse
	err := json.Unmarshal(c.Response.Body(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "task-123", resp.TaskID)
	assert.Equal(t, "Test Task", resp.Title)

	helper.AssertExpectations(t)
}

// TestGetTask_TASK_NOT_FOUND 测试任务不存在的错误
//
// 对应 usecases.yaml 中的错误：TASK_NOT_FOUND
// 错误消息："任务不存在"
// HTTP 状态码：404
func TestGetTask_TASK_NOT_FOUND(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询返回空结果
	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("nonexistent-task").
		WillReturnError(sql.ErrNoRows)

	c := app.NewContext(0)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "nonexistent-task"})

	helper.HandlerDeps.GetTaskHandler(context.Background(), c)

	// 验证响应：应返回 404
	assert.Equal(t, consts.StatusNotFound, c.Response.StatusCode())

	var errResp dto.ErrorResponse
	err := json.Unmarshal(c.Response.Body(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "TASK_NOT_FOUND", "错误码应包含任务不存在")

	helper.AssertExpectations(t)
}
