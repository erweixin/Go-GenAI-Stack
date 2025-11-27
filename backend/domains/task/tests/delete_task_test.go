package tests

import (
	"context"
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/cloudwego/hertz/pkg/route/param"
	"github.com/stretchr/testify/assert"
)

// TestDeleteTask_Success 测试成功删除任务
func TestDeleteTask_Success(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 创建测试任务
	task := CreateTestTaskWithID("task-123")

	// Mock FindByID 查询（检查存在）
	MockFindByID(helper.Mock, task)

	// Mock 删除操作
	helper.Mock.ExpectExec("DELETE FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnResult(sqlmock.NewResult(0, 1))

	c := app.NewContext(0)
	SetAuthContext(c, TestUserID)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "task-123"})

	helper.HandlerDeps.DeleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusOK, c.Response.StatusCode())

	helper.AssertExpectations(t)
}

// TestDeleteTask_TASK_NOT_FOUND 测试删除不存在的任务
//
// 对应 usecases.yaml 中的错误：TASK_NOT_FOUND
// 错误消息："任务不存在"
// HTTP 状态码：404
func TestDeleteTask_TASK_NOT_FOUND(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock FindByID 查询返回 not found
	helper.Mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs("nonexistent").
		WillReturnError(sql.ErrNoRows)

	c := app.NewContext(0)
	SetAuthContext(c, TestUserID)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "nonexistent"})

	helper.HandlerDeps.DeleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusNotFound, c.Response.StatusCode())

	helper.AssertExpectations(t)
}

// TestDeleteTask_DELETION_FAILED 测试删除失败
//
// 对应 usecases.yaml 中的错误：DELETION_FAILED
// 错误消息："删除任务失败"
// HTTP 状态码：500
func TestDeleteTask_DELETION_FAILED(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 创建测试任务
	task := CreateTestTaskWithID("task-123")

	// Mock FindByID 查询成功
	MockFindByID(helper.Mock, task)

	// Mock 删除失败
	helper.Mock.ExpectExec("DELETE FROM tasks WHERE id").
		WithArgs("task-123").
		WillReturnError(sql.ErrConnDone)

	c := app.NewContext(0)
	SetAuthContext(c, TestUserID)
	c.Params = append(c.Params, param.Param{Key: "id", Value: "task-123"})

	helper.HandlerDeps.DeleteTaskHandler(context.Background(), c)

	// 验证响应
	assert.Equal(t, consts.StatusInternalServerError, c.Response.StatusCode())

	helper.AssertExpectations(t)
}
