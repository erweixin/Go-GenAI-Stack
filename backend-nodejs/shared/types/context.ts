/**
 * 请求上下文类型
 * 用于在 Handler、Service、Repository 层之间传递请求相关信息
 */

/**
 * 请求上下文接口
 * 包含请求追踪、用户信息等上下文数据
 */
export interface RequestContext {
  /**
   * 请求 ID（每个请求唯一）
   * 用于日志追踪和问题排查
   */
  requestId?: string;

  /**
   * 用户 ID（从 JWT Token 中提取）
   * 用于权限检查和业务逻辑
   */
  userId?: string;

  /**
   * 追踪 ID（用于分布式追踪）
   * 跨服务请求时保持相同的 TraceID
   */
  traceId?: string;

  /**
   * 扩展字段（用于未来扩展）
   * 可以添加 IP、UserAgent 等信息
   */
  [key: string]: unknown;
}

/**
 * 创建空的请求上下文
 * 用于测试或不需要上下文信息的场景
 */
export function createEmptyContext(): RequestContext {
  return {};
}

/**
 * 从 FastifyRequest 创建请求上下文
 * 提取请求 ID、用户 ID 等信息
 */
export function createContextFromRequest(req: {
  requestId?: string;
  userId?: string;
  traceId?: string;
  [key: string]: unknown;
}): RequestContext {
  return {
    requestId: req.requestId,
    userId: req.userId,
    traceId: req.traceId,
  };
}

