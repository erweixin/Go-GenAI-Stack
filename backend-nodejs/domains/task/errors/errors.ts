/**
 * Task 领域错误定义
 * 遵循 "ERROR_CODE: message" 格式
 */

export class TaskError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'TaskError';
  }
}

// 错误定义
export const TaskErrors = {
  TASK_TITLE_EMPTY: new TaskError(
    'TASK_TITLE_EMPTY',
    '任务标题不能为空'
  ),
  TASK_NOT_FOUND: new TaskError('TASK_NOT_FOUND', '任务不存在'),
  TASK_ALREADY_COMPLETED: new TaskError(
    'TASK_ALREADY_COMPLETED',
    '任务已完成，不能再次完成'
  ),
  INVALID_PRIORITY: new TaskError(
    'INVALID_PRIORITY',
    '优先级无效，必须是 low, medium 或 high'
  ),
  INVALID_DUE_DATE: new TaskError(
    'INVALID_DUE_DATE',
    '截止日期不能早于创建日期'
  ),
  TOO_MANY_TAGS: new TaskError('TOO_MANY_TAGS', '标签过多，最多 10 个'),
  TAG_NAME_EMPTY: new TaskError('TAG_NAME_EMPTY', '标签名不能为空'),
  DUPLICATE_TAG: new TaskError('DUPLICATE_TAG', '标签重复'),
  USER_ID_REQUIRED: new TaskError(
    'USER_ID_REQUIRED',
    '用户 ID 不能为空'
  ),
  UNAUTHORIZED_ACCESS: new TaskError(
    'UNAUTHORIZED_ACCESS',
    '无权访问此任务'
  ),
  CREATION_FAILED: new TaskError('CREATION_FAILED', '创建任务失败'),
  UPDATE_FAILED: new TaskError('UPDATE_FAILED', '更新任务失败'),
  DELETION_FAILED: new TaskError('DELETION_FAILED', '删除任务失败'),
  COMPLETION_FAILED: new TaskError('COMPLETION_FAILED', '完成任务失败'),
  QUERY_FAILED: new TaskError('QUERY_FAILED', '查询失败'),
};

/**
 * 解析错误码
 */
export function parseErrorCode(error: unknown): string {
  if (error instanceof TaskError) {
    return error.code;
  }
  if (error instanceof Error) {
    // 尝试从错误消息中提取错误码（格式：ERROR_CODE: message）
    const match = error.message.match(/^([A-Z_]+):/);
    if (match) {
      return match[1];
    }
  }
  return 'INTERNAL_ERROR';
}

