/**
 * Handler 依赖容器
 * 注入 Service 层依赖
 */

import type { TaskService } from '../service/task_service.js';

export interface HandlerDependencies {
  taskService: TaskService;
}
