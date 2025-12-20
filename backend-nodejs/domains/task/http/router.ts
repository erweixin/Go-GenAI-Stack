/**
 * Task 路由注册
 * 注册所有 Task 相关的 HTTP 路由
 */

import type { FastifyInstance } from 'fastify';
import type { HandlerDependencies } from '../handlers/dependencies.js';
import type { CreateTaskRequest, UpdateTaskRequest, ListTasksQuery } from './dto/task.js';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  ListTasksQuerySchema,
} from './dto/task.js';
import { createTaskHandler } from '../handlers/create_task.handler.js';
import { updateTaskHandler } from '../handlers/update_task.handler.js';
import { completeTaskHandler } from '../handlers/complete_task.handler.js';
import { deleteTaskHandler } from '../handlers/delete_task.handler.js';
import { getTaskHandler } from '../handlers/get_task.handler.js';
import { listTasksHandler } from '../handlers/list_tasks.handler.js';
import type { createAuthMiddleware } from '../../../infrastructure/middleware/auth.js';

/**
 * 注册 Task 路由
 */
export function registerTaskRoutes(
  app: FastifyInstance,
  deps: HandlerDependencies,
  authMiddleware: ReturnType<typeof createAuthMiddleware>
): void {
  // POST /api/tasks - 创建任务（需要认证）
  app.post<{ Body: CreateTaskRequest }>(
    '/api/tasks',
    {
      preHandler: authMiddleware,
      schema: {
        body: CreateTaskRequestSchema,
      },
    },
    async (req, reply) => {
      await createTaskHandler(deps, req, reply);
    }
  );

  // GET /api/tasks - 列出任务（需要认证）
  app.get<{ Querystring: ListTasksQuery }>(
    '/api/tasks',
    {
      preHandler: authMiddleware,
      schema: {
        querystring: ListTasksQuerySchema,
      },
    },
    async (req, reply) => {
      await listTasksHandler(deps, req, reply);
    }
  );

  // GET /api/tasks/:id - 获取任务详情（需要认证）
  app.get<{ Params: { id: string } }>(
    '/api/tasks/:id',
    {
      preHandler: authMiddleware,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (req, reply) => {
      await getTaskHandler(deps, req, reply);
    }
  );

  // PUT /api/tasks/:id - 更新任务（需要认证）
  app.put<{ Params: { id: string }; Body: UpdateTaskRequest }>(
    '/api/tasks/:id',
    {
      preHandler: authMiddleware,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: UpdateTaskRequestSchema,
      },
    },
    async (req, reply) => {
      await updateTaskHandler(deps, req, reply);
    }
  );

  // POST /api/tasks/:id/complete - 完成任务（需要认证）
  app.post<{ Params: { id: string } }>(
    '/api/tasks/:id/complete',
    {
      preHandler: authMiddleware,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (req, reply) => {
      await completeTaskHandler(deps, req, reply);
    }
  );

  // DELETE /api/tasks/:id - 删除任务（需要认证）
  app.delete<{ Params: { id: string } }>(
    '/api/tasks/:id',
    {
      preHandler: authMiddleware,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (req, reply) => {
      await deleteTaskHandler(deps, req, reply);
    }
  );
}

