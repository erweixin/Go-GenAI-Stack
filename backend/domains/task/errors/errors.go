package errors

import "github.com/erweixin/go-genai-stack/backend/shared/errors"

// Task 领域错误定义
//
// 对应 usecases.yaml 和 rules.md 中定义的错误
var (
	// ========== 验证错误 (400) ==========

	// ErrTaskTitleEmpty 任务标题不能为空
	// 规则: R1.1
	// 场景: CreateTask, UpdateTask
	ErrTaskTitleEmpty = errors.New("TASK_TITLE_EMPTY", "任务标题不能为空", 400)

	// ErrTaskDescriptionTooLong 任务描述过长
	// 规则: R1.2
	// 场景: CreateTask, UpdateTask
	ErrTaskDescriptionTooLong = errors.New("TASK_DESCRIPTION_TOO_LONG", "任务描述过长，最大 5000 字符", 400)

	// ErrInvalidPriority 优先级无效
	// 规则: R1.3
	// 场景: CreateTask, UpdateTask
	ErrInvalidPriority = errors.New("INVALID_PRIORITY", "优先级无效，必须是 low, medium 或 high", 400)

	// ErrInvalidDueDate 截止日期无效
	// 规则: R1.4
	// 场景: CreateTask, UpdateTask
	ErrInvalidDueDate = errors.New("INVALID_DUE_DATE", "截止日期不能早于创建日期", 400)

	// ErrTagNameEmpty 标签名称不能为空
	// 规则: R1.5
	// 场景: AddTag
	ErrTagNameEmpty = errors.New("TAG_NAME_EMPTY", "标签名称不能为空", 400)

	// ErrTooManyTags 标签过多
	// 规则: R3.3
	// 场景: CreateTask, UpdateTask, AddTag
	ErrTooManyTags = errors.New("TOO_MANY_TAGS", "标签过多，最多 10 个", 400)

	// ErrDuplicateTag 标签重复
	// 规则: R3.2
	// 场景: AddTag
	ErrDuplicateTag = errors.New("DUPLICATE_TAG", "标签名称重复", 400)

	// ErrInvalidFilter 筛选参数无效
	// 规则: R5.2
	// 场景: ListTasks
	ErrInvalidFilter = errors.New("INVALID_FILTER", "筛选参数无效", 400)

	// ErrInvalidPagination 分页参数无效
	// 规则: R5.1
	// 场景: ListTasks
	ErrInvalidPagination = errors.New("INVALID_PAGINATION", "分页参数无效", 400)

	// ========== 状态错误 (400) ==========

	// ErrTaskAlreadyCompleted 任务已完成
	// 规则: R2.1
	// 场景: CompleteTask, UpdateTask
	ErrTaskAlreadyCompleted = errors.New("TASK_ALREADY_COMPLETED", "任务已完成，不能再次完成", 400)

	// ErrInvalidStatusTransition 状态转换无效
	// 规则: R2.3
	// 场景: UpdateTask
	ErrInvalidStatusTransition = errors.New("INVALID_STATUS_TRANSITION", "状态转换无效", 400)

	// ========== 授权错误 (401, 403) ==========

	// ErrUserIDRequired 用户 ID 不能为空
	// 场景: 所有需要认证的操作
	ErrUserIDRequired = errors.New("USER_ID_REQUIRED", "用户 ID 不能为空", 401)

	// ErrUnauthorizedAccess 无权访问
	// 规则: R6.1 (未实现)
	// 场景: GetTask, UpdateTask, DeleteTask, CompleteTask
	ErrUnauthorizedAccess = errors.New("UNAUTHORIZED_ACCESS", "无权访问此任务", 403)

	// ========== 资源错误 (404) ==========

	// ErrTaskNotFound 任务不存在
	// 规则: R4.3
	// 场景: GetTask, UpdateTask, DeleteTask, CompleteTask
	ErrTaskNotFound = errors.New("TASK_NOT_FOUND", "任务不存在", 404)

	// ========== 服务器错误 (500) ==========

	// ErrCreationFailed 创建任务失败
	// 场景: CreateTask
	ErrCreationFailed = errors.New("CREATION_FAILED", "创建任务失败", 500)

	// ErrUpdateFailed 更新任务失败
	// 场景: UpdateTask
	ErrUpdateFailed = errors.New("UPDATE_FAILED", "更新任务失败", 500)

	// ErrCompletionFailed 完成任务失败
	// 场景: CompleteTask
	ErrCompletionFailed = errors.New("COMPLETION_FAILED", "完成任务失败", 500)

	// ErrDeletionFailed 删除任务失败
	// 场景: DeleteTask
	ErrDeletionFailed = errors.New("DELETION_FAILED", "删除任务失败", 500)

	// ErrQueryFailed 查询失败
	// 场景: ListTasks, GetTask
	ErrQueryFailed = errors.New("QUERY_FAILED", "查询失败", 500)
)
