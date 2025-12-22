/**
 * Task HTTP DTO
 * 定义 HTTP 请求和响应的数据结构
 */

import { z } from 'zod';

// ========================================
// CreateTask
// ========================================

export const CreateTaskRequestSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').max(200, '任务标题过长，最大 200 字符'),
  description: z.string().max(5000, '描述过长，最大 5000 字符').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10, '标签过多，最多 10 个').optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export interface CreateTaskResponse {
  task_id: string;
  title: string;
  status: string;
  created_at: string; // ISO 8601
}

// ========================================
// UpdateTask
// ========================================

export const UpdateTaskRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export interface UpdateTaskResponse {
  task_id: string;
  title: string;
  status: string;
  updated_at: string; // ISO 8601
}

// ========================================
// Params Schemas (for route params)
// ========================================

export const TaskParamsSchema = z.object({
  id: z.string().min(1, '任务 ID 不能为空'),
});

export type TaskParams = z.infer<typeof TaskParamsSchema>;

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

export const ListTasksQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tag: z.string().optional(),
  due_date_from: z.string().datetime().optional(),
  due_date_to: z.string().datetime().optional(),
  keyword: z.string().optional(),
  sort_by: z.enum(['created_at', 'due_date', 'priority']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;

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
