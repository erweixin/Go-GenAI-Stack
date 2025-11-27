import { useState } from 'react'
import { useTaskStore } from '../stores/task.store'
import { taskApi } from '../api/task.api'
import type { CreateTaskRequest, TaskItem } from '@go-genai-stack/types'

/**
 * 创建任务 Hook
 * 
 * 用例：CreateTask
 * 
 * @returns {object} { createTask, loading, error }
 */
export function useTaskCreate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addTask } = useTaskStore()

  const createTask = async (data: CreateTaskRequest): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await taskApi.create(data)
      
      // 构建完整的 TaskItem 并添加到 store
      const newTask: TaskItem = {
        task_id: response.task_id,
        title: response.title,
        description: data.description,
        status: response.status,
        priority: data.priority || 'medium',
        tags: data.tags || [],
        created_at: response.created_at,
        due_date: data.due_date,
      }
      
      addTask(newTask)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task'
      setError(message)
      console.error('Failed to create task:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    createTask,
    loading,
    error,
  }
}

