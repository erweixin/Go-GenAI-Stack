/**
 * Prometheus Metrics 定义
 * 收集 HTTP 请求和数据库查询的指标
 */

import { Registry, Counter, Histogram } from 'prom-client';

// 创建全局 Registry
const register = new Registry();

// 收集默认指标（CPU、内存等）
register.setDefaultLabels({
  app: 'go-genai-stack-nodejs',
});

// HTTP 请求计数器
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// HTTP 请求延迟直方图
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // 延迟桶（秒）
  registers: [register],
});

// 数据库查询延迟直方图
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2], // 延迟桶（秒）
  registers: [register],
});

// 数据库查询计数器
export const dbQueryCounter = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register],
});

// 导出 Registry（用于 /metrics 端点）
export { register };

