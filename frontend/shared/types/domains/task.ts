// Code generated from Go structs. DO NOT EDIT manually.
// Source: backend/domains/task/http/dto
// Generated: 2024-11-24

// ============================================
// Task Domain Types
// ============================================

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

/**
 * 任务优先级
 */
export type TaskPriority = 'low' | 'medium' | 'high'

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string // ISO 8601 格式
  tags?: string[]
}

/**
 * 创建任务响应
 */
export interface CreateTaskResponse {
  task_id: string
  title: string
  status: TaskStatus
  created_at: string // ISO 8601 格式
}

/**
 * 更新任务请求
 */
export interface UpdateTaskRequest {
  title?: string
  description?: string
  priority?: TaskPriority
  due_date?: string // ISO 8601 格式
  tags?: string[]
}

/**
 * 更新任务响应
 */
export interface UpdateTaskResponse {
  task_id: string
  title: string
  status: TaskStatus
  updated_at: string // ISO 8601 格式
}

/**
 * 完成任务响应
 */
export interface CompleteTaskResponse {
  task_id: string
  status: TaskStatus
  completed_at: string // ISO 8601 格式
}

/**
 * 删除任务响应
 */
export interface DeleteTaskResponse {
  success: boolean
  deleted_at: string // ISO 8601 格式
}

/**
 * 获取任务响应
 */
export interface GetTaskResponse {
  task_id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string // ISO 8601 格式
  tags: string[]
  created_at: string // ISO 8601 格式
  updated_at: string // ISO 8601 格式
  completed_at?: string // ISO 8601 格式
}

/**
 * 列出任务请求（查询参数）
 */
export interface ListTasksRequest {
  // 筛选参数
  status?: TaskStatus
  priority?: TaskPriority
  tag?: string
  due_date_from?: string // YYYY-MM-DD 格式
  due_date_to?: string // YYYY-MM-DD 格式
  keyword?: string

  // 排序参数
  sort_by?: 'created_at' | 'due_date' | 'priority'
  sort_order?: 'asc' | 'desc'

  // 分页参数
  page?: number
  limit?: number
}

/**
 * 任务列表项
 */
export interface TaskItem {
  task_id: string
  title: string
  description?: string // 任务描述（可选）
  status: TaskStatus
  priority: TaskPriority
  due_date?: string // ISO 8601 格式
  tags: string[]
  created_at: string // ISO 8601 格式
  completed_at?: string // ISO 8601 格式（仅完成的任务）
}

/**
 * 列出任务响应
 */
export interface ListTasksResponse {
  tasks: TaskItem[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  error: string
  message: string
  details?: string
}
