/**
 * 中间件类型定义
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * 认证中间件类型
 */
export type AuthMiddleware = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
