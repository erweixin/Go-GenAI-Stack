import { create } from 'zustand'
import type { TaskItem, TaskStatus, TaskPriority } from '@go-genai-stack/types'

interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  tag?: string
  keyword?: string
}

interface TaskState {
  // 状态
  tasks: TaskItem[]
  selectedTask: TaskItem | null
  loading: boolean
  error: string | null
  
  // 筛选条件
  filters: TaskFilters
  
  // Actions
  setTasks: (tasks: TaskItem[]) => void
  addTask: (task: TaskItem) => void
  updateTask: (taskId: string, task: Partial<TaskItem>) => void
  deleteTask: (taskId: string) => void
  setSelectedTask: (task: TaskItem | null) => void
  setFilters: (filters: TaskFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
  filters: {},
}

/**
 * Task Store
 * 
 * 任务状态管理
 */
export const useTaskStore = create<TaskState>((set) => ({
  ...initialState,
  
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [task, ...state.tasks] 
  })),
  
  updateTask: (taskId, updatedTask) => set((state) => ({
    tasks: state.tasks.map((t) => 
      t.task_id === taskId ? { ...t, ...updatedTask } : t
    ),
  })),
  
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((t) => t.task_id !== taskId),
  })),
  
  setSelectedTask: (task) => set({ selectedTask: task }),
  
  setFilters: (filters) => set({ filters }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}))

