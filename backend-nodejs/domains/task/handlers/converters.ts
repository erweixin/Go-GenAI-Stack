/**
 * DTO 转换层
 * HTTP DTO ↔ Domain Input/Output 的转换
 */

import type { Task } from '../model/task.js';
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  CompleteTaskResponse,
  DeleteTaskResponse,
  GetTaskResponse,
  ListTasksQuery,
  ListTasksResponse,
  TaskItem,
} from '../http/dto/task.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CompleteTaskInput,
  DeleteTaskInput,
  GetTaskInput,
  ListTasksInput,
} from '../service/task_service.js';
import type { TaskFilter } from '../repository/interface.js';

// ========================================
// CreateTask 转换
// ========================================

export function toCreateTaskInput(
  userId: string,
  req: CreateTaskRequest
): CreateTaskInput {
  const input: CreateTaskInput = {
    userId,
    title: req.title,
    description: req.description || '',
    priority: req.priority || 'medium',
    tags: req.tags,
  };

  // 解析截止日期
  if (req.due_date) {
    const dueDate = new Date(req.due_date);
    if (isNaN(dueDate.getTime())) {
      throw new Error('INVALID_DUE_DATE: 截止日期格式无效');
    }
    input.dueDate = dueDate;
  }

  return input;
}

export function toCreateTaskResponse(task: Task): CreateTaskResponse {
  return {
    task_id: task.id,
    title: task.title,
    status: task.status,
    created_at: task.createdAt.toISOString(),
  };
}

// ========================================
// UpdateTask 转换
// ========================================

export function toUpdateTaskInput(
  userId: string,
  taskId: string,
  req: UpdateTaskRequest
): UpdateTaskInput {
  const input: UpdateTaskInput = {
    userId,
    taskId,
  };

  if (req.title !== undefined) {
    input.title = req.title;
  }
  if (req.description !== undefined) {
    input.description = req.description;
  }
  if (req.priority !== undefined) {
    input.priority = req.priority;
  }
  if (req.due_date !== undefined) {
    const dueDate = new Date(req.due_date);
    if (isNaN(dueDate.getTime())) {
      throw new Error('INVALID_DUE_DATE: 截止日期格式无效');
    }
    input.dueDate = dueDate;
  }
  if (req.tags !== undefined) {
    input.tags = req.tags;
  }

  return input;
}

export function toUpdateTaskResponse(task: Task): UpdateTaskResponse {
  return {
    task_id: task.id,
    title: task.title,
    status: task.status,
    updated_at: task.updatedAt.toISOString(),
  };
}

// ========================================
// CompleteTask 转换
// ========================================

export function toCompleteTaskInput(
  userId: string,
  taskId: string
): CompleteTaskInput {
  return {
    userId,
    taskId,
  };
}

export function toCompleteTaskResponse(task: Task): CompleteTaskResponse {
  return {
    task_id: task.id,
    status: task.status,
    completed_at: task.completedAt!.toISOString(),
  };
}

// ========================================
// DeleteTask 转换
// ========================================

export function toDeleteTaskInput(
  userId: string,
  taskId: string
): DeleteTaskInput {
  return {
    userId,
    taskId,
  };
}

export function toDeleteTaskResponse(
  success: boolean,
  deletedAt: Date
): DeleteTaskResponse {
  return {
    success,
    deleted_at: deletedAt.toISOString(),
  };
}

// ========================================
// GetTask 转换
// ========================================

export function toGetTaskInput(userId: string, taskId: string): GetTaskInput {
  return {
    userId,
    taskId,
  };
}

export function toGetTaskResponse(task: Task): GetTaskResponse {
  const response: GetTaskResponse = {
    task_id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    tags: task.tags.map((t) => t.name),
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };

  if (task.dueDate) {
    response.due_date = task.dueDate.toISOString();
  }

  if (task.completedAt) {
    response.completed_at = task.completedAt.toISOString();
  }

  return response;
}

// ========================================
// ListTasks 转换
// ========================================

export function toListTasksInput(
  userId: string,
  query: ListTasksQuery
): ListTasksInput {
  const filter: TaskFilter = {
    userId,
    page: query.page || 1,
    limit: query.limit || 20,
    sortBy: query.sort_by || 'created_at',
    sortOrder: query.sort_order || 'desc',
  };

  if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.tag) {
    filter.tag = query.tag;
  }
  if (query.keyword) {
    filter.keyword = query.keyword;
  }
  if (query.due_date_from) {
    filter.dueDateFrom = new Date(query.due_date_from);
  }
  if (query.due_date_to) {
    filter.dueDateTo = new Date(query.due_date_to);
  }

  return { filter };
}

export function toListTasksResponse(
  tasks: Task[],
  totalCount: number,
  page: number,
  limit: number,
  hasMore: boolean
): ListTasksResponse {
  const taskItems: TaskItem[] = tasks.map((task) => {
    const item: TaskItem = {
      task_id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      tags: task.tags.map((t) => t.name),
      created_at: task.createdAt.toISOString(),
    };

    if (task.dueDate) {
      item.due_date = task.dueDate.toISOString();
    }

    return item;
  });

  return {
    tasks: taskItems,
    total_count: totalCount,
    page,
    limit,
    has_more: hasMore,
  };
}

