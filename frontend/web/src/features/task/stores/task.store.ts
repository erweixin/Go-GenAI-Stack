import { create } from 'zustand'
import type { TaskItem, TaskStatus, TaskPriority } from '@go-genai-stack/types'

/**
 * 任务筛选条件
 */
export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  tag?: string
  keyword?: string
}

/**
 * Task UI State
 *
 * 注意：服务器数据（任务列表）已由 React Query 管理
 * 此 Store 仅管理客户端 UI 状态
 */
interface TaskUIState {
  // UI 状态
  selectedTask: TaskItem | null

  // 筛选条件（用于 React Query）
  filters: TaskFilters

  // Actions
  setSelectedTask: (task: TaskItem | null) => void
  setFilters: (filters: TaskFilters) => void
  reset: () => void
}

const initialState = {
  selectedTask: null,
  filters: {},
}

/**
 * Task Store（仅 UI 状态）
 *
 * 数据管理已迁移到 React Query：
 * - 任务列表：useTasksQuery()
 * - 创建任务：useTaskCreateMutation()
 * - 更新任务：useTaskUpdateMutation()
 * - 完成任务：useTaskCompleteMutation()
 * - 删除任务：useTaskDeleteMutation()
 */
export const useTaskStore = create<TaskUIState>((set) => ({
  ...initialState,

  setSelectedTask: (task) => set({ selectedTask: task }),

  setFilters: (filters) => set({ filters }),

  reset: () => set(initialState),
}))
