/**
 * Task HTTP DTO
 * 定义 HTTP 请求和响应的数据结构
 */

// ========================================
// CreateTask
// ========================================

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO 8601
  tags?: string[];
}

export interface CreateTaskResponse {
  task_id: string;
  title: string;
  status: string;
  created_at: string; // ISO 8601
}

// ========================================
// UpdateTask
// ========================================

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string; // ISO 8601
  tags?: string[];
}

export interface UpdateTaskResponse {
  task_id: string;
  title: string;
  status: string;
  updated_at: string; // ISO 8601
}

// ========================================
// CompleteTask
// ========================================

export interface CompleteTaskResponse {
  task_id: string;
  status: string;
  completed_at: string; // ISO 8601
}

// ========================================
// DeleteTask
// ========================================

export interface DeleteTaskResponse {
  success: boolean;
  deleted_at: string; // ISO 8601
}

// ========================================
// GetTask
// ========================================

export interface GetTaskResponse {
  task_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string; // ISO 8601
  tags: string[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  completed_at?: string; // ISO 8601
}

// ========================================
// ListTasks
// ========================================

export interface ListTasksQuery {
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  due_date_from?: string; // ISO 8601 date
  due_date_to?: string; // ISO 8601 date
  keyword?: string;
  sort_by?: 'created_at' | 'due_date' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TaskItem {
  task_id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string; // ISO 8601
  tags: string[];
  created_at: string; // ISO 8601
}

export interface ListTasksResponse {
  tasks: TaskItem[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ========================================
// Error Response
// ========================================

export interface ErrorResponse {
  error: string; // 错误码
  message: string; // 错误消息
  details?: string; // 详细信息（可选）
}

