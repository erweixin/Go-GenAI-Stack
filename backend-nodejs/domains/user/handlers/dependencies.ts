/**
 * Handler 依赖容器
 * 注入 Service 层依赖
 */

import type { UserService } from '../service/user_service.js';

export interface HandlerDependencies {
  userService: UserService;
}
