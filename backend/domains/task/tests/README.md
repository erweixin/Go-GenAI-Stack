# Task Domain Tests

本目录包含 Task 领域的所有测试。

## 📁 文件结构

```
tests/
├── README.md                 # 本文件
├── helpers_test.go           # 测试辅助工具
├── create_task_test.go       # CreateTask 用例测试
├── update_task_test.go       # UpdateTask 用例测试
├── complete_task_test.go     # CompleteTask 用例测试
├── delete_task_test.go       # DeleteTask 用例测试
├── get_task_test.go          # GetTask 用例测试
└── list_tasks_test.go        # ListTasks 用例测试
```

## 🧪 测试策略

### 1. 基于 usecases.yaml 的测试

每个测试文件对应 `usecases.yaml` 中的一个用例，覆盖：
- ✅ 成功路径测试
- ✅ 所有声明的 errors 测试
- ✅ 边界条件测试

### 2. 使用 sqlmock

所有测试使用 `go-sqlmock` 模拟数据库，无需真实数据库：
- 快速执行
- 独立运行
- 可重复

### 3. Table-Driven Tests

使用 Table-Driven Tests 模式提高覆盖率。

## 🚀 运行测试

```bash
# 运行所有测试
cd backend
go test ./domains/task/tests/...

# 运行单个测试文件
go test ./domains/task/tests/create_task_test.go

# 带详细输出
go test -v ./domains/task/tests/...

# 带覆盖率
go test -cover ./domains/task/tests/...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./domains/task/tests/...
go tool cover -html=coverage.out
```

## 📊 测试覆盖率目标

| 组件 | 目标覆盖率 | 当前状态 |
|------|-----------|---------|
| Handlers | 90%+ | 🚧 进行中 |
| Model | 85%+ | 📝 待添加 |
| Repository | 80%+ | 📝 待添加 |

## 📝 测试编写规范

### 测试函数命名

```go
// 格式：Test<UseCase>_<Scenario>
func TestCreateTask_Success(t *testing.T)
func TestCreateTask_TASK_TITLE_EMPTY(t *testing.T)
func TestUpdateTask_TASK_NOT_FOUND(t *testing.T)
```

### 错误测试命名

错误测试使用 `usecases.yaml` 中声明的错误码作为测试名：
- `TestCreateTask_TASK_TITLE_EMPTY` ← 对应 usecases.yaml 中的 `TASK_TITLE_EMPTY`
- `TestUpdateTask_TASK_NOT_FOUND` ← 对应 `TASK_NOT_FOUND`

### 测试结构

```go
func TestXXX_YYY(t *testing.T) {
    // 1. Setup
    helper := NewTestHelper(t)
    defer helper.Close()
    
    // 2. Mock 期望
    helper.Mock.ExpectExec("...")...
    
    // 3. 准备请求
    req := dto.XXXRequest{...}
    
    // 4. 执行
    helper.HandlerService.XXXHandler(ctx, c)
    
    // 5. 断言
    assert.Equal(t, expectedStatus, c.Response.StatusCode())
    
    // 6. 验证 Mock
    helper.AssertExpectations(t)
}
```

## 🔧 测试辅助工具

### TestHelper

提供：
- SQL Mock 数据库
- Handler Service 实例
- Context 创建
- 断言辅助方法

使用示例：

```go
func TestExample(t *testing.T) {
    helper := NewTestHelper(t)
    defer helper.Close()
    
    // 使用 helper.Mock 设置期望
    helper.Mock.ExpectQuery("SELECT").
        WillReturnRows(...)
    
    // 使用 helper.HandlerService 调用 Handler
    helper.HandlerService.GetTaskHandler(ctx, c)
    
    // 验证所有期望都被满足
    helper.AssertExpectations(t)
}
```

## 📚 参考资料

- [usecases.yaml](../usecases.yaml) - 用例声明和错误定义
- [rules.md](../rules.md) - 业务规则
- [sqlmock 文档](https://github.com/DATA-DOG/go-sqlmock)
- [testify 文档](https://github.com/stretchr/testify)

## ✅ 测试完成度

- [x] helpers_test.go - 测试辅助工具
- [x] create_task_test.go - CreateTask 用例（8 个测试）
- [ ] update_task_test.go - UpdateTask 用例
- [ ] complete_task_test.go - CompleteTask 用例
- [ ] delete_task_test.go - DeleteTask 用例
- [ ] get_task_test.go - GetTask 用例
- [ ] list_tasks_test.go - ListTasks 用例

## 🐛 已知问题

无

## 📝 待办事项

1. [ ] 添加 Model 层测试
2. [ ] 添加 Repository 层集成测试
3. [ ] 添加性能测试
4. [ ] 添加并发测试

---

**最后更新**：2025-11-23

