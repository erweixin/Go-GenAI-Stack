/**
 * 应用入口
 * 初始化配置、数据库、服务器并启动服务
 */

import 'dotenv/config';
import { loadConfig } from '../../infrastructure/config/config.js';
import { createDatabaseConnection } from '../../infrastructure/persistence/postgres/connection.js';
import {
  createRedisConnection,
  connectRedis,
  testRedisConnection,
  closeRedisConnection,
} from '../../infrastructure/persistence/redis/connection.js';
import {
  createServer,
  registerMiddleware,
  registerRoutes,
  registerDomainRoutes,
} from '../../infrastructure/bootstrap/server.js';
import type { RedisClientType } from 'redis';
import { TaskRepositoryImpl } from '../../domains/task/repository/task_repo.js';
import { TaskService } from '../../domains/task/service/task_service.js';
import type { HandlerDependencies as TaskHandlerDependencies } from '../../domains/task/handlers/dependencies.js';
import { UserRepositoryImpl } from '../../domains/user/repository/user_repo.js';
import { UserService } from '../../domains/user/service/user_service.js';
import type { HandlerDependencies as UserHandlerDependencies } from '../../domains/user/handlers/dependencies.js';
import { JWTService } from '../../domains/auth/service/jwt_service.js';
import { AuthService } from '../../domains/auth/service/auth_service.js';
import type { HandlerDependencies as AuthHandlerDependencies } from '../../domains/auth/handlers/dependencies.js';
import { createAuthMiddleware } from '../../infrastructure/middleware/auth.js';

async function main() {
  console.log('\n🚀 Starting Go-GenAI-Stack Backend (Node.js)...\n');

  // 1. 加载配置（.env 文件已通过 dotenv/config 自动加载）
  console.log('📋 Loading configuration...');
  const config = loadConfig();
  console.log('✅ Configuration loaded:');
  console.log(`   Environment: ${config.server.env}`);
  console.log(`   Server: ${config.server.host}:${config.server.port}`);
  console.log(
    `   Database: ${config.database.user}@${config.database.host}:${config.database.port}/${config.database.database}`
  );

  // 2. 初始化数据库连接
  console.log('\n🗄️  Connecting to database...');
  let db: ReturnType<typeof createDatabaseConnection>;
  try {
    db = createDatabaseConnection(config.database);
    // 测试连接
    // await db.selectFrom('users').select('id').limit(1).execute();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.error('   Make sure PostgreSQL is running and schema is applied');
    process.exit(1);
  }

  // 3. 初始化 Redis 连接
  console.log('\n🔴 Connecting to Redis...');
  let redis: RedisClientType | null = null;
  try {
    redis = createRedisConnection(config.redis);
    await connectRedis(redis);
    const redisOk = await testRedisConnection(redis);
    if (redisOk) {
      console.log('✅ Redis connected');
    } else {
      console.warn('⚠️  Redis connection test failed (continuing without cache)');
      await closeRedisConnection(redis);
      redis = null;
    }
  } catch (error) {
    console.warn('⚠️  Redis connection failed:', error);
    console.warn('   Continuing without cache');
    redis = null;
  }

  // 4. 创建 Fastify 服务器
  console.log('\n🚀 Creating HTTP server...');
  const fastify = createServer(config);

  // 5. 注册中间件
  console.log('📦 Registering middleware...');
  await registerMiddleware(fastify);

  // 6. 注册基础路由
  console.log('🛣️  Registering routes...');
  registerRoutes(fastify, db, redis);

  // 7. 初始化领域服务
  console.log('🏗️  Initializing domain services...');
  
  // Task 领域
  const taskRepo = new TaskRepositoryImpl(db);
  const taskService = new TaskService(taskRepo);
  const taskHandlerDeps: TaskHandlerDependencies = {
    taskService,
  };

  // User 领域
  const userRepo = new UserRepositoryImpl(db);
  const userService = new UserService(userRepo);
  const userHandlerDeps: UserHandlerDependencies = {
    userService,
  };

  // Auth 领域
  const jwtService = new JWTService({
    secret: config.jwt.secret,
    accessTokenExpiry: config.jwt.accessTokenExpiry,
    refreshTokenExpiry: config.jwt.refreshTokenExpiry,
    issuer: config.jwt.issuer,
  });
  const authService = new AuthService(userRepo, jwtService);
  const authHandlerDeps: AuthHandlerDependencies = {
    authService,
  };

  // 创建认证中间件
  const authMiddleware = createAuthMiddleware(jwtService);

  // 8. 注册领域路由
  console.log('📚 Registering domain routes...');
  await registerDomainRoutes(fastify, {
    task: taskHandlerDeps,
    user: userHandlerDeps,
    auth: authHandlerDeps,
  }, authMiddleware);

  // 9. 启动服务器
  const address = `http://${config.server.host}:${config.server.port}`;
  try {
    await fastify.listen({
      host: config.server.host,
      port: config.server.port,
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🚀 Server started on ${address}`);
    console.log(`📚 API Base: ${address}/api`);
    console.log(`💚 Health Check: ${address}/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }

  // 10. 优雅关闭
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      await fastify.close();
      await db.destroy();
      if (redis) {
        await closeRedisConnection(redis);
      }
      console.log('✅ Server exited');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// 启动应用
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

