import { useState } from 'react'
import { useTaskStore } from '../stores/task.store'
import { taskApi } from '../api/task.api'
import type { UpdateTaskRequest } from '@go-genai-stack/types'

/**
 * 更新任务 Hook
 * 
 * 用例：UpdateTask
 * 
 * @returns {object} { updateTask, loading, error }
 */
export function useTaskUpdate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updateTask: updateTaskInStore } = useTaskStore()

  const updateTask = async (
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await taskApi.update(taskId, data)
      
      // 更新 store 中的任务
      updateTaskInStore(taskId, {
        title: response.title,
        status: response.status,
        ...data,
      })
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task'
      setError(message)
      console.error('Failed to update task:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    updateTask,
    loading,
    error,
  }
}

