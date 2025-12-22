/**
 * Task Service 领域服务层
 * 实现业务用例，封装复杂业务流程
 */

import { Task } from '../model/task.js';
import type { TaskRepository, TaskFilter } from '../repository/interface.js';
import { createError } from '../../../shared/errors/errors.js';
import type { RequestContext } from '../../../shared/types/context.js';
import type { EventBus } from '../../shared/events/event_bus.js';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskCompletedEvent,
  TaskDeletedEvent,
} from '../events/task_events.js';
import type { UserQueryService } from '../../user/service/user_query_service.js';

export interface CreateTaskInput {
  userId: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
}

export interface CreateTaskOutput {
  task: Task;
}

export interface UpdateTaskInput {
  userId: string;
  taskId: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
}

export interface UpdateTaskOutput {
  task: Task;
}

export interface CompleteTaskInput {
  userId: string;
  taskId: string;
}

export interface CompleteTaskOutput {
  task: Task;
}

export interface DeleteTaskInput {
  userId: string;
  taskId: string;
}

export interface DeleteTaskOutput {
  success: boolean;
  deletedAt: Date;
}

export interface GetTaskInput {
  userId: string;
  taskId: string;
}

export interface GetTaskOutput {
  task: Task;
}

export interface ListTasksInput {
  filter: TaskFilter;
}

export interface ListTasksOutput {
  tasks: Task[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * TaskService 任务领域服务
 * 
 * 注意：使用 UserQueryService 进行同步查询（验证用户是否存在）
 * 不直接调用 UserService，遵循"分布式友好但不分布式"原则
 */
export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private eventBus: EventBus,
    private userQueryService: UserQueryService
  ) {}

  /**
   * 创建任务
   */
  async createTask(ctx: RequestContext, input: CreateTaskInput): Promise<CreateTaskOutput> {
    // Step 1: ValidateInput
    if (!input.userId || input.userId.trim().length === 0) {
      throw createError('VALIDATION_ERROR', '用户 ID 不能为空');
    }
    if (!input.title || input.title.trim().length === 0) {
      throw createError('TASK_TITLE_EMPTY', '任务标题不能为空');
    }

    // Step 1.5: 验证用户是否存在（使用查询接口，而非直接调用 UserService）
    const userExists = await this.userQueryService.userExists(ctx, input.userId);
    if (!userExists) {
      throw createError('USER_NOT_FOUND', '用户不存在');
    }

    // Step 2 & 3: CreateTaskEntity
    const priority = input.priority || 'medium';
    const task = Task.create(input.userId, input.title, input.description, priority);

    // 设置截止日期
    if (input.dueDate) {
      task.setDueDate(input.dueDate);
    }

    // 添加标签
    if (input.tags && input.tags.length > 10) {
      throw createError('VALIDATION_ERROR', '标签过多，最多 10 个');
    }

    if (input.tags) {
      for (const tagName of input.tags) {
        task.addTag({
          name: tagName,
          color: '#808080', // 默认颜色
        });
      }
    }

    // Step 4: SaveTask
    await this.taskRepo.create(ctx, task);

    // Step 5: PublishTaskCreatedEvent
    await this.eventBus.publish(
      ctx,
      new TaskCreatedEvent({
        taskId: task.id,
        userId: task.userId,
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        tags: task.tags.map((t) => t.name),
        createdAt: task.createdAt,
      })
    );

    return { task };
  }

  /**
   * 更新任务
   */
  async updateTask(ctx: RequestContext, input: UpdateTaskInput): Promise<UpdateTaskOutput> {
    // Step 1: ValidateUserID
    if (!input.userId || input.userId.trim().length === 0) {
      throw createError('VALIDATION_ERROR', '用户 ID 不能为空');
    }

    // Step 2: GetTask
    const task = await this.taskRepo.findById(ctx, input.taskId);
    if (!task) {
      throw createError('TASK_NOT_FOUND', '任务不存在');
    }

    // Step 2.1: CheckOwnership
    if (task.userId !== input.userId) {
      throw createError('UNAUTHORIZED', '无权访问此任务');
    }

    // Step 3: CheckIfCompleted
    if (task.status === 'completed') {
      throw createError('TASK_ALREADY_COMPLETED', '已完成的任务不能更新');
    }

    // Step 4: UpdateTaskFields
    if (input.title !== undefined) {
      task.update(input.title, undefined, undefined);
    }
    if (input.description !== undefined) {
      task.update(undefined, input.description, undefined);
    }
    if (input.priority !== undefined) {
      task.update(undefined, undefined, input.priority);
    }
    if (input.dueDate !== undefined) {
      task.setDueDate(input.dueDate);
    }

    // 更新标签
    if (input.tags !== undefined) {
      // 清空现有标签
      task.tags.forEach((tag) => task.removeTag(tag.name));
      // 添加新标签
      for (const tagName of input.tags) {
        task.addTag({
          name: tagName,
          color: '#808080',
        });
      }
    }

    // Step 5: SaveTask
    await this.taskRepo.update(ctx, task);

    // Step 6: PublishTaskUpdatedEvent
    await this.eventBus.publish(
      ctx,
      new TaskUpdatedEvent({
        taskId: task.id,
        userId: task.userId,
        updatedFields: {
          title: input.title !== undefined ? input.title : undefined,
          description: input.description !== undefined ? input.description : undefined,
          priority: input.priority !== undefined ? input.priority : undefined,
          dueDate: input.dueDate !== undefined ? input.dueDate.toISOString() : undefined,
          tags: input.tags !== undefined ? input.tags : undefined,
        },
        updatedAt: task.updatedAt,
      })
    );

    return { task };
  }

  /**
   * 完成任务
   */
  async completeTask(ctx: RequestContext, input: CompleteTaskInput): Promise<CompleteTaskOutput> {
    // Step 1: ValidateUserID
    if (!input.userId || input.userId.trim().length === 0) {
      throw createError('VALIDATION_ERROR', '用户 ID 不能为空');
    }

    // Step 2: GetTask
    const task = await this.taskRepo.findById(ctx, input.taskId);
    if (!task) {
      throw createError('TASK_NOT_FOUND', '任务不存在');
    }

    // Step 3: CheckOwnership
    if (task.userId !== input.userId) {
      throw createError('UNAUTHORIZED', '无权访问此任务');
    }

    // Step 4 & 5: CheckStatus & MarkAsCompleted
    task.complete();

    // Step 7: SaveTask
    await this.taskRepo.update(ctx, task);

    // Step 8: PublishTaskCompletedEvent
    await this.eventBus.publish(
      ctx,
      new TaskCompletedEvent({
        taskId: task.id,
        userId: task.userId,
        completedAt: task.completedAt!,
      })
    );

    return { task };
  }

  /**
   * 删除任务
   */
  async deleteTask(ctx: RequestContext, input: DeleteTaskInput): Promise<DeleteTaskOutput> {
    // Step 1: ValidateUserID
    if (!input.userId || input.userId.trim().length === 0) {
      throw createError('VALIDATION_ERROR', '用户 ID 不能为空');
    }

    // Step 2: GetTask
    const task = await this.taskRepo.findById(ctx, input.taskId);
    if (!task) {
      throw createError('TASK_NOT_FOUND', '任务不存在');
    }

    // Step 3: CheckOwnership
    if (task.userId !== input.userId) {
      throw createError('UNAUTHORIZED', '无权访问此任务');
    }

    // Step 4: DeleteTaskRecord
    await this.taskRepo.delete(ctx, input.taskId);

    // Step 5: PublishTaskDeletedEvent
    await this.eventBus.publish(
      ctx,
      new TaskDeletedEvent({
        taskId: input.taskId,
        userId: input.userId,
        deletedAt: new Date(),
      })
    );

    return {
      success: true,
      deletedAt: new Date(),
    };
  }

  /**
   * 获取任务详情
   */
  async getTask(ctx: RequestContext, input: GetTaskInput): Promise<GetTaskOutput> {
    // Step 1: ValidateUserID
    if (!input.userId || input.userId.trim().length === 0) {
      throw createError('VALIDATION_ERROR', '用户 ID 不能为空');
    }

    // Step 2: GetTask
    const task = await this.taskRepo.findById(ctx, input.taskId);
    if (!task) {
      throw createError('TASK_NOT_FOUND', '任务不存在');
    }

    // Step 3: CheckOwnership
    if (task.userId !== input.userId) {
      throw createError('UNAUTHORIZED', '无权访问此任务');
    }

    return { task };
  }

  /**
   * 列出任务
   */
  async listTasks(ctx: RequestContext, input: ListTasksInput): Promise<ListTasksOutput> {
    // Step 2 & 3: QueryTasks + CountTotalTasks
    const { tasks, total } = await this.taskRepo.list(ctx, input.filter);

    // Step 4: FormatResponse
    const hasMore = input.filter.page * input.filter.limit < total;

    return {
      tasks,
      totalCount: total,
      page: input.filter.page,
      limit: input.filter.limit,
      hasMore,
    };
  }
}

