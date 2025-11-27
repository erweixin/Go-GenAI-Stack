import { useState } from 'react'
import { useTaskStore } from '../stores/task.store'
import { taskApi } from '../api/task.api'

/**
 * 完成任务 Hook
 * 
 * 用例：CompleteTask
 * 
 * @returns {object} { completeTask, loading, error }
 */
export function useTaskComplete() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { updateTask } = useTaskStore()

  const completeTask = async (taskId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await taskApi.complete(taskId)
      
      // 更新 store 中的任务状态
      updateTask(taskId, {
        status: response.status,
        completed_at: response.completed_at,
      })
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete task'
      setError(message)
      console.error('Failed to complete task:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    completeTask,
    loading,
    error,
  }
}

