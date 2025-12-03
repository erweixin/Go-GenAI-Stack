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
 * Task API
 *
 * 对齐后端 backend/domains/task
 * API Prefix: /api/tasks
 */
export const taskApi = {
  /**
   * 创建任务
   *
   * @param data 创建任务请求
   * @returns 创建任务响应
   */
  create: async (data: CreateTaskRequest): Promise<CreateTaskResponse> => {
    return api.post<CreateTaskResponse>('/api/tasks', data)
  },

  /**
   * 获取任务列表
   *
   * @param params 查询参数（可选）
   * @returns 任务列表响应
   */
  list: async (params?: ListTasksRequest): Promise<ListTasksResponse> => {
    return api.get<ListTasksResponse>('/api/tasks', { params })
  },

  /**
   * 获取任务详情
   *
   * @param taskId 任务 ID
   * @returns 任务详情响应
   */
  get: async (taskId: string): Promise<GetTaskResponse> => {
    return api.get<GetTaskResponse>(`/api/tasks/${taskId}`)
  },

  /**
   * 更新任务
   *
   * @param taskId 任务 ID
   * @param data 更新任务请求
   * @returns 更新任务响应
   */
  update: async (taskId: string, data: UpdateTaskRequest): Promise<UpdateTaskResponse> => {
    return api.put<UpdateTaskResponse>(`/api/tasks/${taskId}`, data)
  },

  /**
   * 完成任务
   *
   * @param taskId 任务 ID
   * @returns 完成任务响应
   */
  complete: async (taskId: string): Promise<CompleteTaskResponse> => {
    return api.post<CompleteTaskResponse>(`/api/tasks/${taskId}/complete`)
  },

  /**
   * 删除任务
   *
   * @param taskId 任务 ID
   * @returns 删除任务响应
   */
  delete: async (taskId: string): Promise<DeleteTaskResponse> => {
    return api.delete<DeleteTaskResponse>(`/api/tasks/${taskId}`)
  },
}
