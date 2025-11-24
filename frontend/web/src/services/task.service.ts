import { api } from '@/lib/api-client'
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
  CompleteTaskResponse,
  DeleteTaskResponse,
  GetTaskResponse,
  ListTasksRequest,
  ListTasksResponse,
} from '@go-genai-stack/types'

/**
 * 任务服务
 * 
 * 提供任务管理的 API 接口
 */
export const taskService = {
  /**
   * 创建任务
   */
  createTask: async (data: CreateTaskRequest): Promise<CreateTaskResponse> => {
    return api.post<CreateTaskResponse>('/api/tasks', data)
  },

  /**
   * 获取任务列表
   */
  listTasks: async (params?: ListTasksRequest): Promise<ListTasksResponse> => {
    return api.get<ListTasksResponse>('/api/tasks', { params })
  },

  /**
   * 获取任务详情
   */
  getTask: async (taskId: string): Promise<GetTaskResponse> => {
    return api.get<GetTaskResponse>(`/api/tasks/${taskId}`)
  },

  /**
   * 更新任务
   */
  updateTask: async (taskId: string, data: UpdateTaskRequest): Promise<UpdateTaskResponse> => {
    return api.put<UpdateTaskResponse>(`/api/tasks/${taskId}`, data)
  },

  /**
   * 删除任务
   */
  deleteTask: async (taskId: string): Promise<DeleteTaskResponse> => {
    return api.delete<DeleteTaskResponse>(`/api/tasks/${taskId}`)
  },

  /**
   * 完成任务
   */
  completeTask: async (taskId: string): Promise<CompleteTaskResponse> => {
    return api.post<CompleteTaskResponse>(`/api/tasks/${taskId}/complete`)
  },
}

