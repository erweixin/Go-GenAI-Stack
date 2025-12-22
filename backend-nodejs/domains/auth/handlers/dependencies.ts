/**
 * Handler 依赖容器
 * 注入 Service 层依赖
 */

import type { AuthService } from '../service/auth_service.js';

export interface HandlerDependencies {
  authService: AuthService;
}
