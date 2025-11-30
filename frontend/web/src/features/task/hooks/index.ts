/**
 * Task Hooks 导出文件
 * 
 * 统一导出所有 task 相关的 hooks
 */

// React Query Hooks（推荐使用）
export {
  useTasksQuery,
  useTaskQuery,
  taskKeys,
} from './useTasks.query'

export {
  useTaskCreateMutation,
  useTaskUpdateMutation,
  useTaskCompleteMutation,
  useTaskDeleteMutation,
} from './useTasks.mutation'

// 旧版 Hooks（保留以保证向后兼容，但推荐迁移到 React Query 版本）
export { useTasks } from './useTasks'
export { useTaskCreate } from './useTaskCreate'
export { useTaskUpdate } from './useTaskUpdate'
export { useTaskComplete } from './useTaskComplete'
export { useTaskDelete } from './useTaskDelete'

