import { useQuery } from '@tanstack/react-query'
import { taskApi } from '../api/task.api'
import type { ListTasksRequest } from '@go-genai-stack/types'

/**
 * Query Keys for Task
 * 
 * 统一管理所有 task 相关的 query key
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: ListTasksRequest) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
}

/**
 * 任务列表 Hook (React Query 版本)
 * 
 * 用例：ListTasks
 * 
 * 使用 TanStack Query 进行数据缓存和自动刷新
 * 
 * @param filters 筛选条件
 * @param options 额外的 query 选项
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useTasksQuery({ status: 'pending' })
 * ```
 */
export function useTasksQuery(filters?: ListTasksRequest) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskApi.list(filters),
    select: (data) => data.tasks, // 只返回 tasks 数组
  })
}

/**
 * 单个任务详情 Hook (React Query 版本)
 * 
 * 用例：GetTask
 * 
 * @param taskId 任务 ID
 * @param options 额外的 query 选项
 * 
 * @example
 * ```tsx
 * const { data: task, isLoading } = useTaskQuery('task-123')
 * ```
 */
export function useTaskQuery(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => taskApi.get(taskId),
    select: (data) => data.task, // 只返回 task 对象
    enabled: !!taskId && enabled, // 仅在有 taskId 且 enabled 时才执行
  })
}

