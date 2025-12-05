/**
 * E2E 测试数据
 *
 * 统一的测试用户和数据，确保测试可重复
 */

export const testUsers = {
  /**
   * 已存在的测试用户（需要在测试数据库中预先创建）
   */
  validUser: {
    email: 'e2e-test@example.com',
    password: 'Test123456!',
  },

  /**
   * 新用户（用于注册测试）
   */
  newUser: {
    email: `e2e-new-${Date.now()}@example.com`,
    password: 'NewUser123!',
    username: 'e2euser',
    full_name: 'E2E Test User',
  },
}

export const testTasks = {
  /**
   * 基本任务
   */
  basic: {
    title: 'E2E Test Task - Basic',
    description: 'This is a basic test task created by E2E test',
    priority: 'medium' as const,
  },

  /**
   * 高优先级任务
   */
  urgent: {
    title: 'E2E Test Task - Urgent',
    description: 'This is an urgent test task',
    priority: 'high' as const,
    tags: ['urgent', 'important'],
  },

  /**
   * 带标签任务
   */
  withTags: {
    title: 'E2E Test Task - With Tags',
    description: 'Task with multiple tags',
    priority: 'low' as const,
    tags: ['tag1', 'tag2', 'tag3'],
  },
}
