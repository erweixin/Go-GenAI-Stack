import { useState } from 'react'
import { useTaskStore } from '../stores/task.store'
import { taskApi } from '../api/task.api'

/**
 * 删除任务 Hook
 * 
 * 用例：DeleteTask
 * 
 * @returns {object} { deleteTask, loading, error }
 */
export function useTaskDelete() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { deleteTask: deleteTaskFromStore } = useTaskStore()

  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await taskApi.delete(taskId)
      
      // 从 store 中删除任务
      deleteTaskFromStore(taskId)
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task'
      setError(message)
      console.error('Failed to delete task:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteTask,
    loading,
    error,
  }
}

