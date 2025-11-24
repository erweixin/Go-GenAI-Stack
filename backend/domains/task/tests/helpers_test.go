package tests

import (
	"bytes"
	"context"
	"database/sql"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/common/ut"
	"github.com/erweixin/go-genai-stack/backend/domains/task/handlers"
	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
	"github.com/erweixin/go-genai-stack/backend/domains/task/repository"
	"github.com/erweixin/go-genai-stack/backend/domains/task/service"
)

// ========== 测试常量 ==========

const (
	// 测试任务数据
	TestTaskID          = "test-task-123"
	TestTaskTitle       = "Test Task"
	TestTaskDescription = "Test Description"
	TestPriority        = "medium"
	TestStatus          = "pending"

	// 测试标签
	TestTagName1  = "urgent"
	TestTagColor1 = "#ff0000"
	TestTagName2  = "important"
	TestTagColor2 = "#00ff00"
)

// TestTime 测试时间常量
var TestTime = time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)

// TestHelper 提供测试辅助方法
type TestHelper struct {
	DB          *sql.DB
	Mock        sqlmock.Sqlmock
	HandlerDeps *handlers.HandlerDependencies
	Server      *server.Hertz // 使用完整的 Server 而不是 Engine
	Ctx         context.Context
}

// NewTestHelper 创建测试辅助工具
//
// 使用 sqlmock 模拟数据库，避免依赖真实数据库
// 使用 server.Default() 创建完整的 Server 以支持 BindAndValidate
//
// 三层架构：
// - Repository Layer → Service Layer → Handler Dependencies
func NewTestHelper(t *testing.T) *TestHelper {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	// 1. 创建 Repository（基础设施层）
	taskRepo := repository.NewTaskRepository(db)

	// 2. 创建 Domain Service（领域层）
	taskService := service.NewTaskService(taskRepo)

	// 3. 创建 Handler Dependencies（Handler 层）
	handlerDeps := handlers.NewHandlerDependencies(taskService)

	// 创建完整的 Server（包含绑定器初始化）
	// 使用测试端口，快速退出
	h := server.Default(
		server.WithHostPorts("127.0.0.1:0"), // 随机端口（用于 ut 测试不会真正绑定）
		server.WithExitWaitTime(0),          // 测试时快速退出
	)

	return &TestHelper{
		DB:          db,
		Mock:        mock,
		HandlerDeps: handlerDeps,
		Server:      h,
		Ctx:         context.Background(),
	}
}

// Close 清理资源
func (h *TestHelper) Close() error {
	return h.DB.Close()
}

// AssertExpectations 验证所有 mock 期望都被满足
func (h *TestHelper) AssertExpectations(t *testing.T) {
	if err := h.Mock.ExpectationsWereMet(); err != nil {
		t.Errorf("unfulfilled expectations: %v", err)
	}
}

// PerformRequest 使用 Hertz ut 包执行请求
//
// 使用 server.Default() 创建的 Server，BindAndValidate 可以正常工作
func (h *TestHelper) PerformRequest(method, path string, body io.Reader, headers ...map[string]string) *ut.ResponseRecorder {
	var bodyOpt *ut.Body
	if body != nil {
		// 将 body 读取到 bytes 以获取长度
		buf := new(bytes.Buffer)
		buf.ReadFrom(body)
		bodyBytes := buf.Bytes()

		bodyOpt = &ut.Body{
			Body: bytes.NewReader(bodyBytes),
			Len:  len(bodyBytes),
		}
	}

	// 构建 headers
	var headerOpts []ut.Header
	for _, headerMap := range headers {
		for k, v := range headerMap {
			headerOpts = append(headerOpts, ut.Header{Key: k, Value: v})
		}
	}

	// 使用 Server 的 Engine 进行测试
	return ut.PerformRequest(h.Server.Engine, method, path, bodyOpt, headerOpts...)
}

// RegisterRoute 注册路由到测试 Server
func (h *TestHelper) RegisterRoute(method, path string, handler app.HandlerFunc) {
	switch method {
	case "GET":
		h.Server.GET(path, handler)
	case "POST":
		h.Server.POST(path, handler)
	case "PUT":
		h.Server.PUT(path, handler)
	case "DELETE":
		h.Server.DELETE(path, handler)
	case "PATCH":
		h.Server.PATCH(path, handler)
	}
}

// PerformRealRequest 发送真实的 HTTP 请求（用于集成测试）
//
// 注意：这个方法需要在测试中手动启动服务器
// 示例：
//
//	go helper.Server.Spin()
//	defer helper.Server.Close()
//	resp, err := helper.PerformRealRequest(t, "POST", "/api/tasks", body, headers)
func (h *TestHelper) PerformRealRequest(t *testing.T, method, path string, body io.Reader, headers map[string]string) (*http.Response, error) {
	// 注意：需要在外部调用 go h.Server.Spin()

	// 构建 URL（假设测试端口在创建 Server 时指定）
	url := "http://127.0.0.1:8080" + path

	// 创建请求
	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, err
	}

	// 设置 headers
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	// 发送请求
	client := &http.Client{}
	return client.Do(req)
}

// ========== 测试数据生成器 ==========

// CreateTestTask 创建标准测试任务
func CreateTestTask() *model.Task {
	task, _ := model.NewTask(
		TestTaskTitle,
		TestTaskDescription,
		model.Priority(TestPriority),
	)
	return task
}

// CreateTestTaskWithID 创建带指定 ID 的测试任务
func CreateTestTaskWithID(id string) *model.Task {
	task := CreateTestTask()
	task.ID = id
	return task
}

// CreateTestTaskWithTags 创建带标签的测试任务
func CreateTestTaskWithTags(tagNames ...string) *model.Task {
	task := CreateTestTask()
	for _, tagName := range tagNames {
		task.AddTag(model.Tag{
			Name:  tagName,
			Color: "#808080",
		})
	}
	return task
}

// CreateTestTaskWithCustomFields 创建自定义字段的测试任务
func CreateTestTaskWithCustomFields(title, description string, priority model.Priority) *model.Task {
	task, _ := model.NewTask(title, description, priority)
	return task
}

// CreateCompletedTestTask 创建已完成的测试任务
func CreateCompletedTestTask() *model.Task {
	task := CreateTestTask()
	task.Complete()
	return task
}

// ========== Mock 辅助函数 ==========

// MockFindByID Mock 查询任务
func MockFindByID(mock sqlmock.Sqlmock, task *model.Task) {
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority",
		"due_date", "created_at", "updated_at", "completed_at",
	}).AddRow(
		task.ID, task.Title, task.Description,
		string(task.Status), string(task.Priority),
		task.DueDate, task.CreatedAt, task.UpdatedAt, task.CompletedAt,
	)

	mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
		WithArgs(task.ID).
		WillReturnRows(rows)

	MockLoadTags(mock, task.ID, task.Tags)
}

// MockLoadTags Mock 加载标签
func MockLoadTags(mock sqlmock.Sqlmock, taskID string, tags []model.Tag) {
	tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"})
	for _, tag := range tags {
		tagsRows.AddRow(tag.Name, tag.Color)
	}

	mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags WHERE task_id").
		WithArgs(taskID).
		WillReturnRows(tagsRows)
}

// MockInsertTask Mock 插入任务
func MockInsertTask(mock sqlmock.Sqlmock, task *model.Task) {
	mock.ExpectExec("INSERT INTO tasks").
		WithArgs(
			task.ID,
			task.Title,
			task.Description,
			string(task.Status),
			string(task.Priority),
			task.DueDate,
			sqlmock.AnyArg(), // CreatedAt
			sqlmock.AnyArg(), // UpdatedAt
			task.CompletedAt,
		).
		WillReturnResult(sqlmock.NewResult(1, 1))
}

// MockInsertTags Mock 插入标签
func MockInsertTags(mock sqlmock.Sqlmock, taskID string, tags []model.Tag) {
	for _, tag := range tags {
		mock.ExpectExec("INSERT INTO task_tags").
			WithArgs(taskID, tag.Name, tag.Color).
			WillReturnResult(sqlmock.NewResult(1, 1))
	}
}

// MockUpdateTask Mock 更新任务
func MockUpdateTask(mock sqlmock.Sqlmock, task *model.Task) {
	mock.ExpectExec("UPDATE tasks SET").
		WithArgs(
			task.Title,
			task.Description,
			string(task.Status),
			string(task.Priority),
			task.DueDate,
			sqlmock.AnyArg(), // UpdatedAt
			task.CompletedAt,
			task.ID,
		).
		WillReturnResult(sqlmock.NewResult(0, 1))
}

// MockDeleteOldTags Mock 删除旧标签
func MockDeleteOldTags(mock sqlmock.Sqlmock, taskID string) {
	mock.ExpectExec("DELETE FROM task_tags WHERE task_id").
		WithArgs(taskID).
		WillReturnResult(sqlmock.NewResult(0, 0))
}

// MockCompleteUpdate Mock 完成任务的完整更新操作
// 包括：FindByID -> LoadTags -> Update -> DeleteTags
func MockCompleteUpdate(mock sqlmock.Sqlmock, task *model.Task) {
	// 1. FindByID
	MockFindByID(mock, task)

	// 2. Update
	MockUpdateTask(mock, task)

	// 3. Delete old tags
	MockDeleteOldTags(mock, task.ID)

	// 4. Insert new tags (if any)
	if len(task.Tags) > 0 {
		MockInsertTags(mock, task.ID, task.Tags)
	}
}

// MockCount Mock 统计总数
func MockCount(mock sqlmock.Sqlmock, count int) {
	countRows := sqlmock.NewRows([]string{"count"}).AddRow(count)
	mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks").
		WillReturnRows(countRows)
}

// MockListTasks Mock 列出任务
func MockListTasks(mock sqlmock.Sqlmock, tasks []*model.Task) {
	rows := sqlmock.NewRows([]string{
		"id", "title", "description", "status", "priority",
		"due_date", "created_at", "updated_at", "completed_at",
	})

	for _, task := range tasks {
		rows.AddRow(
			task.ID, task.Title, task.Description,
			string(task.Status), string(task.Priority),
			task.DueDate, task.CreatedAt, task.UpdatedAt, task.CompletedAt,
		)
	}

	mock.ExpectQuery("SELECT (.+) FROM tasks").
		WillReturnRows(rows)

	// Mock tags for each task
	for _, task := range tasks {
		MockLoadTags(mock, task.ID, task.Tags)
	}
}
