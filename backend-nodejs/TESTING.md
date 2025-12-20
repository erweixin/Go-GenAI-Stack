# 测试文档

## 测试框架

- **单元测试框架**: Vitest
- **HTTP 测试**: Supertest
- **测试运行器**: Vitest (支持 watch 模式和 UI)

## 测试结构

```
backend-nodejs/
├── vitest.config.ts          # Vitest 配置
├── domains/
│   └── task/
│       ├── model/
│       │   └── task.test.ts  # Model 单元测试
│       └── tests/
│           ├── helpers.ts            # 测试辅助工具（非测试文件）
│           ├── create_task.test.ts   # CreateTask Handler 测试
│           ├── get_task.test.ts      # GetTask Handler 测试
│           ├── list_tasks.test.ts    # ListTasks Handler 测试
│           ├── update_task.test.ts   # UpdateTask Handler 测试
│           ├── complete_task.test.ts # CompleteTask Handler 测试
│           └── delete_task.test.ts   # DeleteTask Handler 测试
```

## 运行测试

### 运行所有测试
```bash
npm test
```

### Watch 模式（开发时使用）
```bash
npm run test:watch
```

### UI 模式（可视化测试）
```bash
npm run test:ui
```

### 生成覆盖率报告
```bash
npm run test:coverage
```

### 运行特定领域的测试
```bash
npm run test:task
```

## 测试类型

### 1. 单元测试（Unit Tests）

**位置**: `domains/{domain}/model/*.test.ts`

**示例**: `domains/task/model/task.test.ts`

**覆盖内容**:
- Model 业务逻辑
- 验证规则
- 状态变更
- 边界条件

**特点**:
- 快速执行
- 不依赖外部服务
- 纯函数测试

### 2. 集成测试（Integration Tests）

**位置**: `domains/{domain}/tests/*.test.ts`

**示例**: `domains/task/tests/create_task.test.ts`

**覆盖内容**:
- Handler 完整流程
- HTTP 请求/响应
- 数据库交互
- 认证中间件

**特点**:
- 使用真实数据库（测试数据库）
- 使用 Fastify 的 `inject` 方法进行 HTTP 测试（比 Supertest 更适合 Fastify）
- 需要数据库连接（如果数据库不可用，测试会自动跳过）

## 测试辅助工具

### TestHelper

**位置**: `domains/{domain}/tests/helpers.ts`（注意：不是 `.test.ts`，这是辅助工具文件）

**功能**:
- 创建测试数据库连接
- 初始化 Service 和 Repository
- 创建 Fastify 应用实例
- 生成测试 Token

**使用示例**:
```typescript
import { createTestHelper, TEST_USER_ID } from './helpers.test.js';

const testHelper = createTestHelper(db, jwtService);
const app = testHelper.app;
```

### 测试数据生成器

**函数**:
- `createTestTask()` - 创建标准测试任务
- `createTestTaskWithId(id)` - 创建带指定 ID 的任务
- `createTestTaskWithTags(tagNames)` - 创建带标签的任务
- `createCompletedTestTask()` - 创建已完成的任务

## 测试覆盖情况

### Task 领域 ✅

#### Model 测试 ✅
- ✅ `create` - 任务创建（各种边界情况）
- ✅ `update` - 任务更新
- ✅ `complete` - 任务完成
- ✅ `setDueDate` - 设置截止日期
- ✅ `addTag` - 添加标签
- ✅ `removeTag` - 移除标签

#### Handler 集成测试 ✅
- ✅ `create_task.test.ts` - 创建任务
  - 成功创建
  - 空标题错误
  - 描述过长错误
  - 无效优先级错误
  - 未授权错误
  - 标签相关测试

- ✅ `get_task.test.ts` - 获取任务详情
  - 成功获取
  - 未授权错误
  - 任务不存在错误

- ✅ `list_tasks.test.ts` - 列出任务
  - 成功列出
  - 分页支持
  - 状态筛选
  - 优先级筛选
  - 未授权错误

- ✅ `update_task.test.ts` - 更新任务
  - 成功更新
  - 已完成任务错误
  - 空标题错误
  - 未授权错误
  - 任务不存在错误

- ✅ `complete_task.test.ts` - 完成任务
  - 成功完成
  - 重复完成错误
  - 未授权错误
  - 任务不存在错误

- ✅ `delete_task.test.ts` - 删除任务
  - 成功删除
  - 未授权错误
  - 任务不存在错误

### User 领域 ⏳
- ⏳ Model 测试（待添加）
- ⏳ Handler 集成测试（待添加）

### Auth 领域 ⏳
- ⏳ JWTService 测试（待添加）
- ⏳ AuthService 测试（待添加）
- ⏳ Handler 集成测试（待添加）

## 测试最佳实践

### 1. 测试命名
- 使用描述性名称：`应该成功创建任务`
- 使用中文描述业务场景（符合项目风格）

### 2. 测试结构
```typescript
describe('功能名称', () => {
  let app: FastifyInstance;
  let dbAvailable = false;

  beforeAll(async () => {
    // 测试数据库连接
    try {
      await db.selectFrom('tasks').select('id').limit(1).execute();
      dbAvailable = true;
    } catch {
      console.warn('⚠️  数据库不可用，跳过集成测试');
      return;
    }
    // 初始化测试环境
  });

  afterAll(async () => {
    if (dbAvailable && app) {
      await app.close();
      await testHelper.db.destroy();
    }
  });

  it('应该成功执行操作', async () => {
    if (!dbAvailable) return; // 跳过测试

    const response = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${token}` },
      payload: { ... },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // 断言
  });
});
```

### 3. HTTP 测试方法
- 使用 Fastify 的 `app.inject()` 方法（推荐，比 Supertest 更适合 Fastify）
- 解析响应：`JSON.parse(response.body)`
- 验证状态码：`expect(response.statusCode).toBe(200)`

### 4. 断言
- 使用 `expect` 进行断言
- 验证所有关键属性
- 验证错误码和消息

### 5. 测试数据
- 使用测试常量（`TEST_USER_ID`, `TEST_TASK_TITLE`）
- 使用测试数据生成器
- 避免硬编码测试数据

### 6. 清理
- 在 `afterAll` 中关闭数据库连接
- 清理测试数据（可选，使用测试数据库时）

## 测试环境配置

### 数据库
- 使用独立的测试数据库
- 在 `beforeAll` 中测试数据库连接，如果不可用则跳过测试
- 在 `beforeAll` 中创建测试数据
- 在 `afterAll` 中清理（可选）
- **注意**：如果数据库不可用，所有集成测试会自动跳过，不会导致测试失败

### 认证
- 使用 `JWTService` 生成测试 Token
- 在请求头中携带 `Authorization: Bearer <token>`

## 待完善

### 高优先级
1. **Repository 测试** - 测试数据库操作
2. **Service 测试** - 测试业务逻辑（Mock Repository）
3. **User 领域测试** - 完整的测试套件
4. **Auth 领域测试** - 完整的测试套件

### 中优先级
5. **测试覆盖率** - 达到 80%+ 覆盖率
6. **E2E 测试** - 完整用户流程测试

### 低优先级
7. **性能测试** - 负载测试
8. **压力测试** - 并发测试

## 参考

- [Vitest 文档](https://vitest.dev/)
- [Supertest 文档](https://github.com/visionmedia/supertest)
- Go 后端测试实现：`backend/domains/task/tests/`

