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
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/stretchr/testify/assert"
)

// TestCompleteTask_Success 测试成功完成任务
func TestCompleteTask_Success(t *testing.T) {
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

	// Mock 更新任务状态（先执行 UPDATE）
	helper.Mock.ExpectExec("UPDATE tasks SET (.+) WHERE id").
		WithArgs(
			sqlmock.AnyArg(), // title
			sqlmock.AnyArg(), // description
			sqlmock.AnyArg(), // status = completed
			sqlmock.AnyArg(), // priority
			sqlmock.AnyArg(), // due_date
			sqlmock.AnyArg(), // updated_at
			sqlmock.AnyArg(), // completed_at
			"task-123",       // id
		).
		WillReturnResult(sqlmock.NewResult(0, 1))

	// Mock 删除旧 tags (UPDATE 之后)
	helper.Mock.ExpectExec("DELETE FROM task_tags WHERE task_id").
		WithArgs("task-123").
		WillReturnResult(sqlmock.NewResult(0, 0))

	c := app.NewContext(0)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "task-123"})

	helper.HandlerDeps.CompleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusOK, c.Response.StatusCode())

	var resp dto.CompleteTaskResponse
	err := json.Unmarshal(c.Response.Body(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "task-123", resp.TaskID)
	assert.Equal(t, "completed", resp.Status)

	helper.AssertExpectations(t)
}

// TestCompleteTask_TASK_NOT_FOUND 测试完成不存在的任务
//
// 对应 usecases.yaml 中的错误：TASK_NOT_FOUND
// 错误消息："任务不存在"
// HTTP 状态码：404
func TestCompleteTask_TASK_NOT_FOUND(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询返回空结果
	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("nonexistent").
		WillReturnError(sql.ErrNoRows)

	c := app.NewContext(0)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "nonexistent"})

	helper.HandlerDeps.CompleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusNotFound, c.Response.StatusCode())

	helper.AssertExpectations(t)
}

// TestCompleteTask_TASK_ALREADY_COMPLETED 测试完成已完成的任务
//
// 对应 usecases.yaml 中的错误：TASK_ALREADY_COMPLETED
// 错误消息："任务已完成，不能再次完成"
// HTTP 状态码：400
func TestCompleteTask_TASK_ALREADY_COMPLETED(t *testing.T) {
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

	c := app.NewContext(0)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "task-123"})

	helper.HandlerDeps.CompleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusBadRequest, c.Response.StatusCode())

	var errResp dto.ErrorResponse
	err := json.Unmarshal(c.Response.Body(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "ALREADY_COMPLETED")

	helper.AssertExpectations(t)
}

// TestCompleteTask_COMPLETION_FAILED 测试完成失败
//
// 对应 usecases.yaml 中的错误：COMPLETION_FAILED
// 错误消息："完成任务失败"
// HTTP 状态码：500
func TestCompleteTask_COMPLETION_FAILED(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 查询成功
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

	// Mock 更新失败（先执行 UPDATE，然后失败）
	helper.Mock.ExpectExec("UPDATE tasks SET (.+) WHERE id").
		WillReturnError(sql.ErrConnDone)

	c := app.NewContext(0)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "task-123"})

	helper.HandlerDeps.CompleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusInternalServerError, c.Response.StatusCode())

	helper.AssertExpectations(t)
}
