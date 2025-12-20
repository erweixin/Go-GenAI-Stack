/**
 * Task 路由注册
 * 注册所有 Task 相关的 HTTP 路由
 */

import type { FastifyInstance } from 'fastify';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import type { CreateTaskRequest, UpdateTaskRequest, ListTasksQuery } from './dto/task.js';
import { createTaskHandler } from '../handlers/create_task.handler.js';
import { updateTaskHandler } from '../handlers/update_task.handler.js';
import { completeTaskHandler } from '../handlers/complete_task.handler.js';
import { deleteTaskHandler } from '../handlers/delete_task.handler.js';
import { getTaskHandler } from '../handlers/get_task.handler.js';
import { listTasksHandler } from '../handlers/list_tasks.handler.js';

/**
 * 注册 Task 路由
 */
export function registerTaskRoutes(
  app: FastifyInstance,
  deps: HandlerDependencies
): void {
  // POST /api/tasks - 创建任务
  app.post<{ Body: CreateTaskRequest }>('/api/tasks', async (req, reply) => {
    await createTaskHandler(deps, req as any, reply);
  });

  // GET /api/tasks - 列出任务
  app.get<{ Querystring: ListTasksQuery }>('/api/tasks', async (req, reply) => {
    await listTasksHandler(deps, req as any, reply);
  });

  // GET /api/tasks/:id - 获取任务详情
  app.get<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
    await getTaskHandler(deps, req as any, reply);
  });

  // PUT /api/tasks/:id - 更新任务
  app.put<{ Params: { id: string }; Body: UpdateTaskRequest }>('/api/tasks/:id', async (req, reply) => {
    await updateTaskHandler(deps, req as any, reply);
  });

  // POST /api/tasks/:id/complete - 完成任务
  app.post<{ Params: { id: string } }>('/api/tasks/:id/complete', async (req, reply) => {
    await completeTaskHandler(deps, req as any, reply);
  });

  // DELETE /api/tasks/:id - 删除任务
  app.delete<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
    await deleteTaskHandler(deps, req as any, reply);
  });
}

