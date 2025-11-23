package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/stretchr/testify/assert"
)

// TestCreateTask_Success 测试成功创建任务
//
// 对应 usecases.yaml 中的 CreateTask 用例的成功路径
func TestCreateTask_Success(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// Mock 数据库操作：插入任务
	helper.Mock.ExpectExec("INSERT INTO tasks").
		WithArgs(
			sqlmock.AnyArg(),   // ID (UUID)
			"Test Task",        // Title
			"Test Description", // Description
			"pending",          // Status
			"medium",           // Priority
			sqlmock.AnyArg(),   // DueDate
			sqlmock.AnyArg(),   // CreatedAt
			sqlmock.AnyArg(),   // UpdatedAt
			sqlmock.AnyArg(),   // CompletedAt
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// Mock 插入 tags (有 2 个 tags: "test", "unit")
	helper.Mock.ExpectExec("INSERT INTO task_tags").
		WithArgs(sqlmock.AnyArg(), "test", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))
	helper.Mock.ExpectExec("INSERT INTO task_tags").
		WithArgs(sqlmock.AnyArg(), "unit", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// 准备请求
	req := dto.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
		Priority:    "medium",
		Tags:        []string{"test", "unit"},
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	t.Logf("Response Status: %d", w.Code)
	t.Logf("Response Body: %s", w.Body.String())
	assert.Equal(t, consts.StatusOK, w.Code)

	var resp dto.CreateTaskResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.TaskID)
	assert.Equal(t, "Test Task", resp.Title)
	assert.Equal(t, "pending", resp.Status)

	// 验证 Mock 期望
	helper.AssertExpectations(t)
}

// TestCreateTask_TASK_TITLE_EMPTY 测试标题为空的错误
//
// 对应 usecases.yaml 中的错误：TASK_TITLE_EMPTY
// 错误消息："任务标题不能为空"
// HTTP 状态码：400
func TestCreateTask_TASK_TITLE_EMPTY(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// 准备请求（标题为空）
	req := dto.CreateTaskRequest{
		Title:       "", // 空标题
		Description: "Test Description",
		Priority:    "medium",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应：应返回 400
	assert.Equal(t, consts.StatusBadRequest, w.Code)

	var errResp dto.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "TASK_TITLE_EMPTY", "错误码应包含标题为空错误")

	// 不应该有数据库操作
	helper.AssertExpectations(t)
}

// TestCreateTask_TASK_DESCRIPTION_TOO_LONG 测试描述过长的错误
//
// 对应 usecases.yaml 中的错误：TASK_DESCRIPTION_TOO_LONG
// 错误消息："任务描述过长，最大 5000 字符"
// HTTP 状态码：400
func TestCreateTask_TASK_DESCRIPTION_TOO_LONG(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// 准备请求（描述超过 5000 字符）
	longDescription := string(make([]byte, 5001)) // 5001 字符
	req := dto.CreateTaskRequest{
		Title:       "Test Task",
		Description: longDescription,
		Priority:    "medium",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusBadRequest, w.Code)

	var errResp dto.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "DESCRIPTION_TOO_LONG", "错误码应包含描述过长")

	helper.AssertExpectations(t)
}

// TestCreateTask_INVALID_PRIORITY 测试无效优先级的错误
//
// 对应 usecases.yaml 中的错误：INVALID_PRIORITY
// 错误消息："优先级无效，必须是 low, medium 或 high"
// HTTP 状态码：400
func TestCreateTask_INVALID_PRIORITY(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// 准备请求（无效的优先级）
	req := dto.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
		Priority:    "urgent", // 无效值
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusBadRequest, w.Code)

	var errResp dto.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "INVALID", "错误码应包含无效标识")

	helper.AssertExpectations(t)
}

// TestCreateTask_INVALID_DUE_DATE 测试无效截止日期的错误
//
// 对应 usecases.yaml 中的错误：INVALID_DUE_DATE
// 错误消息："截止日期格式无效或早于当前时间"
// HTTP 状态码：400
func TestCreateTask_INVALID_DUE_DATE(t *testing.T) {
	tests := []struct {
		name    string
		dueDate string
		errMsg  string
	}{
		{
			name:    "无效格式",
			dueDate: "2025-13-01", // 无效的月份
			errMsg:  "INVALID_DUE_DATE",
		},
		{
			name:    "过去的日期",
			dueDate: "2020-01-01T00:00:00Z",
			errMsg:  "INVALID_DUE_DATE",
		},
		{
			name:    "非 ISO 8601 格式",
			dueDate: "2025/12/31",
			errMsg:  "INVALID_DUE_DATE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			helper := NewTestHelper(t)
			defer helper.Close()

			// 注册路由
			helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
				helper.HandlerService.CreateTaskHandler(ctx, c)
			})

			req := dto.CreateTaskRequest{
				Title:       "Test Task",
				Description: "Test Description",
				Priority:    "medium",
				DueDate:     tt.dueDate,
			}
			reqBody, _ := json.Marshal(req)

			// 使用 ut.PerformRequest 执行请求
			w := helper.PerformRequest("POST", "/api/tasks",
				bytes.NewReader(reqBody),
				map[string]string{"Content-Type": "application/json"},
			)

			assert.Equal(t, consts.StatusBadRequest, w.Code)

			var errResp dto.ErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &errResp)
			assert.NoError(t, err)
			assert.Contains(t, errResp.Error, tt.errMsg)

			helper.AssertExpectations(t)
		})
	}
}

// TestCreateTask_TOO_MANY_TAGS 测试标签过多的错误
//
// 对应 usecases.yaml 中的错误：TOO_MANY_TAGS
// 错误消息："标签过多，最多 10 个"
// HTTP 状态码：400
func TestCreateTask_TOO_MANY_TAGS(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// 准备请求（超过 10 个标签）
	tags := make([]string, 11)
	for i := 0; i < 11; i++ {
		tags[i] = fmt.Sprintf("tag%d", i)
	}

	req := dto.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
		Priority:    "medium",
		Tags:        tags, // 11 个标签
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusBadRequest, w.Code)

	var errResp dto.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "TOO_MANY_TAGS", "错误码应包含标签过多")

	helper.AssertExpectations(t)
}

// TestCreateTask_CREATION_FAILED 测试数据库创建失败
//
// 对应 usecases.yaml 中的错误：CREATION_FAILED
// 错误消息："创建任务失败"
// HTTP 状态码：500
func TestCreateTask_CREATION_FAILED(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// Mock 数据库操作失败
	helper.Mock.ExpectExec("INSERT INTO tasks").
		WillReturnError(fmt.Errorf("database connection failed"))

	req := dto.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
		Priority:    "medium",
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应：应返回 500
	assert.Equal(t, consts.StatusInternalServerError, w.Code)

	var errResp dto.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &errResp)
	assert.NoError(t, err)
	assert.Contains(t, errResp.Error, "CREATION_FAILED", "错误码应包含创建失败")

	helper.AssertExpectations(t)
}

// TestCreateTask_WithOptionalFields 测试包含所有可选字段的创建
func TestCreateTask_WithOptionalFields(t *testing.T) {
	helper := NewTestHelper(t)
	defer helper.Close()

	// 注册路由
	helper.RegisterRoute("POST", "/api/tasks", func(ctx context.Context, c *app.RequestContext) {
		helper.HandlerService.CreateTaskHandler(ctx, c)
	})

	// Mock 数据库操作
	helper.Mock.ExpectExec("INSERT INTO tasks").
		WillReturnResult(sqlmock.NewResult(1, 1))
	// Mock tags 插入（3个标签）
	helper.Mock.ExpectExec("INSERT INTO task_tags").
		WillReturnResult(sqlmock.NewResult(1, 1))
	helper.Mock.ExpectExec("INSERT INTO task_tags").
		WillReturnResult(sqlmock.NewResult(1, 1))
	helper.Mock.ExpectExec("INSERT INTO task_tags").
		WillReturnResult(sqlmock.NewResult(1, 1))

	req := dto.CreateTaskRequest{
		Title:       "Complete Task",
		Description: "Full description with all fields",
		Priority:    "high",
		DueDate:     "2025-12-31T23:59:59Z",
		Tags:        []string{"important", "urgent", "project-alpha"},
	}
	reqBody, _ := json.Marshal(req)

	// 使用 ut.PerformRequest 执行请求
	w := helper.PerformRequest("POST", "/api/tasks",
		bytes.NewReader(reqBody),
		map[string]string{"Content-Type": "application/json"},
	)

	// 验证响应
	assert.Equal(t, consts.StatusOK, w.Code)

	var resp dto.CreateTaskResponse
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.TaskID)
	assert.Equal(t, "Complete Task", resp.Title)
	assert.Equal(t, "pending", resp.Status)

	helper.AssertExpectations(t)
}
