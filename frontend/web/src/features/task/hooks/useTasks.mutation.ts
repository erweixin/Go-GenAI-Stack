import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { taskApi } from '../api/task.api'
import { taskKeys } from './useTasks.query'
import type { CreateTaskRequest, UpdateTaskRequest } from '@go-genai-stack/types'

/**
 * 创建任务 Hook (React Query 版本)
 *
 * 用例：CreateTask
 *
 * 使用 TanStack Query Mutation 处理任务创建
 * 成功后自动刷新任务列表
 *
 * @example
 * ```tsx
 * const { mutate: createTask, isPending } = useTaskCreateMutation()
 *
 * const handleCreate = () => {
 *   createTask({
 *     title: 'New Task',
 *     description: 'Task description'
 *   })
 * }
 * ```
 */
export function useTaskCreateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskApi.create(data),

    onSuccess: (response) => {
      // 使所有任务列表查询失效，触发重新获取
      queryClient.invalidateQueries({
        queryKey: taskKeys.lists(),
      })

      toast.success('任务创建成功', {
        description: `任务 "${response.title}" 已创建`,
      })
    },

    onError: (error: any) => {
      toast.error('任务创建失败', {
        description: error?.response?.data?.message || error.message || '未知错误',
      })
    },
  })
}

/**
 * 更新任务 Hook (React Query 版本)
 *
 * 用例：UpdateTask
 *
 * @example
 * ```tsx
 * const { mutate: updateTask } = useTaskUpdateMutation()
 *
 * const handleUpdate = () => {
 *   updateTask({
 *     taskId: 'task-123',
 *     data: { title: 'Updated Title' }
 *   })
 * }
 * ```
 */
export function useTaskUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) =>
      taskApi.update(taskId, data),

    onSuccess: (_response, { taskId }) => {
      // 使任务列表查询失效
      queryClient.invalidateQueries({
        queryKey: taskKeys.lists(),
      })

      // 更新单个任务的缓存
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(taskId),
      })

      toast.success('任务更新成功')
    },

    onError: (error: any) => {
      toast.error('任务更新失败', {
        description: error?.response?.data?.message || error.message || '未知错误',
      })
    },
  })
}

/**
 * 完成任务 Hook (React Query 版本)
 *
 * 用例：CompleteTask
 *
 * @example
 * ```tsx
 * const { mutate: completeTask } = useTaskCompleteMutation()
 *
 * const handleComplete = () => {
 *   completeTask('task-123')
 * }
 * ```
 */
export function useTaskCompleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => taskApi.complete(taskId),

    // 乐观更新（可选）
    onMutate: async (taskId) => {
      // 取消相关的 queries 避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) })
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })

      // 获取旧数据作为回滚备份
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId))
      const previousLists = queryClient.getQueriesData({ queryKey: taskKeys.lists() })

      // 乐观更新任务状态
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          task: {
            ...old.task,
            status: 'completed',
            completed_at: new Date().toISOString(),
          },
        }
      })

      // 返回回滚数据
      return { previousTask, previousLists }
    },

    onSuccess: () => {
      // 使任务列表查询失效
      queryClient.invalidateQueries({
        queryKey: taskKeys.lists(),
      })

      toast.success('任务已完成')
    },

    onError: (error: any, taskId, context) => {
      // 回滚乐观更新
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask)
      }

      toast.error('任务完成失败', {
        description: error?.response?.data?.message || error.message || '未知错误',
      })
    },

    // 总是重新获取数据确保一致性
    onSettled: (_data, _error, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

/**
 * 删除任务 Hook (React Query 版本)
 *
 * 用例：DeleteTask
 *
 * @example
 * ```tsx
 * const { mutate: deleteTask } = useTaskDeleteMutation()
 *
 * const handleDelete = () => {
 *   deleteTask('task-123')
 * }
 * ```
 */
export function useTaskDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(taskId),

    onSuccess: (_response, taskId) => {
      // 移除单个任务的缓存
      queryClient.removeQueries({
        queryKey: taskKeys.detail(taskId),
      })

      // 使任务列表查询失效
      queryClient.invalidateQueries({
        queryKey: taskKeys.lists(),
      })

      toast.success('任务已删除')
    },

    onError: (error: any) => {
      toast.error('任务删除失败', {
        description: error?.response?.data?.message || error.message || '未知错误',
      })
    },
  })
}
