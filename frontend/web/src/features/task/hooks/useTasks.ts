import { useEffect } from 'react'
import { useTaskStore } from '../stores/task.store'
import { taskApi } from '../api/task.api'

/**
 * 任务列表 Hook
 * 
 * 用例：ListTasks
 * 
 * 自动加载任务列表，响应筛选条件变化
 */
export function useTasks() {
  const { tasks, filters, loading, error, setTasks, setLoading, setError } = useTaskStore()

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await taskApi.list(filters)
      setTasks(response.tasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [JSON.stringify(filters)]) // 监听 filters 变化

  return {
    tasks,
    loading,
    error,
    refresh: loadTasks,
  }
}

