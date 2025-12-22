/**
 * Vitest 测试环境设置
 * 在所有测试运行前执行，加载环境变量
 *
 * 注意：数据库连接的清理应该在各个测试文件中使用 afterAll 钩子
 * 参考：infrastructure/testing/test_setup.ts
 */

// 加载 .env 文件（如果存在）
import 'dotenv/config';
