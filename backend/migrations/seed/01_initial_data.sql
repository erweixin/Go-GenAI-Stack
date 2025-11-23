-- ============================================
-- 种子数据 - Task 领域
-- ============================================
-- 包含 30 个示例任务，覆盖不同状态、优先级、标签
-- 用于演示和测试
-- ============================================

-- 清空现有数据（如果需要重新加载）
-- TRUNCATE TABLE tasks, task_tags CASCADE;

-- ============================================
-- 1. Pending 任务（待办）- 10 个
-- ============================================

INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at) VALUES
-- 高优先级
('task-001', '完成项目文档', '编写 README、API 文档和架构说明', 'pending', 'high', '2025-12-01 23:59:59+00', NOW(), NOW()),
('task-002', '修复生产环境 Bug', '用户报告登录失败，需要紧急修复', 'pending', 'high', '2025-11-25 18:00:00+00', NOW(), NOW()),
('task-003', '代码审查 PR #123', '审查新功能的代码实现', 'pending', 'high', '2025-11-26 12:00:00+00', NOW(), NOW()),

-- 中优先级
('task-004', '优化数据库查询', '优化慢查询，提升性能', 'pending', 'medium', '2025-12-05 23:59:59+00', NOW(), NOW()),
('task-005', '添加单元测试', '为新功能添加测试覆盖', 'pending', 'medium', '2025-12-10 23:59:59+00', NOW(), NOW()),
('task-006', '更新依赖包', '升级到最新的稳定版本', 'pending', 'medium', '2025-12-15 23:59:59+00', NOW(), NOW()),

-- 低优先级
('task-007', '整理代码注释', '添加和更新代码注释', 'pending', 'low', '2025-12-20 23:59:59+00', NOW(), NOW()),
('task-008', '调研新技术', '调研 Kubernetes 部署方案', 'pending', 'low', '2025-12-31 23:59:59+00', NOW(), NOW()),
('task-009', '清理临时文件', '删除不再使用的临时代码', 'pending', 'low', '2026-01-10 23:59:59+00', NOW(), NOW()),
('task-010', '更新团队文档', '更新团队协作流程文档', 'pending', 'low', '2026-01-15 23:59:59+00', NOW(), NOW());

-- ============================================
-- 2. In Progress 任务（进行中）- 8 个
-- ============================================

INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at) VALUES
-- 高优先级
('task-011', '实现用户认证', '实现 JWT 认证和权限控制', 'in_progress', 'high', '2025-11-28 23:59:59+00', NOW(), NOW()),
('task-012', '性能优化', '优化首页加载速度', 'in_progress', 'high', '2025-11-30 23:59:59+00', NOW(), NOW()),

-- 中优先级
('task-013', '添加日志监控', '集成 ELK 日志系统', 'in_progress', 'medium', '2025-12-08 23:59:59+00', NOW(), NOW()),
('task-014', '前端组件重构', '重构旧版 UI 组件', 'in_progress', 'medium', '2025-12-12 23:59:59+00', NOW(), NOW()),
('task-015', 'API 文档生成', '使用 Swagger 生成 API 文档', 'in_progress', 'medium', '2025-12-15 23:59:59+00', NOW(), NOW()),

-- 低优先级
('task-016', '编写博客文章', '分享项目技术栈和经验', 'in_progress', 'low', '2026-01-05 23:59:59+00', NOW(), NOW()),
('task-017', '设计新 Logo', '为项目设计新的品牌形象', 'in_progress', 'low', '2026-01-20 23:59:59+00', NOW(), NOW()),
('task-018', '社区运营', '回复 GitHub Issues 和 PR', 'in_progress', 'low', '2026-01-31 23:59:59+00', NOW(), NOW());

-- ============================================
-- 3. Completed 任务（已完成）- 12 个
-- ============================================

INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at, completed_at) VALUES
-- 高优先级（已完成）
('task-019', '修复安全漏洞', '修复 SQL 注入漏洞', 'completed', 'high', '2025-11-20 23:59:59+00', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('task-020', '数据库迁移', '迁移到新的数据库服务器', 'completed', 'high', '2025-11-18 23:59:59+00', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('task-021', '发布 v1.0 版本', '准备和发布第一个正式版本', 'completed', 'high', '2025-11-15 23:59:59+00', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- 中优先级（已完成）
('task-022', '搭建 CI/CD 流程', '配置 GitHub Actions 自动化测试和部署', 'completed', 'medium', '2025-11-12 23:59:59+00', NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('task-023', '集成支付系统', '接入 Stripe 支付网关', 'completed', 'medium', '2025-11-10 23:59:59+00', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('task-024', '实现邮件通知', '配置 SendGrid 邮件服务', 'completed', 'medium', '2025-11-08 23:59:59+00', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('task-025', '添加搜索功能', '实现全文搜索', 'completed', 'medium', '2025-11-05 23:59:59+00', NOW() - INTERVAL '18 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),

-- 低优先级（已完成）
('task-026', '配置开发环境', '编写开发环境搭建文档', 'completed', 'low', '2025-11-03 23:59:59+00', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('task-027', '代码格式化', '统一代码风格和格式', 'completed', 'low', '2025-11-01 23:59:59+00', NOW() - INTERVAL '22 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('task-028', '清理无用代码', '删除已弃用的功能代码', 'completed', 'low', '2025-10-30 23:59:59+00', NOW() - INTERVAL '24 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('task-029', '更新 README', '更新项目说明文档', 'completed', 'low', '2025-10-28 23:59:59+00', NOW() - INTERVAL '26 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
('task-030', '初始化项目', '创建项目仓库和基础结构', 'completed', 'low', '2025-10-25 23:59:59+00', NOW() - INTERVAL '28 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days');

-- ============================================
-- 4. 任务标签
-- ============================================

-- Task 001 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-001', '文档', '#3B82F6'),
('task-001', '优先', '#EF4444');

-- Task 002 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-002', 'Bug', '#EF4444'),
('task-002', '紧急', '#DC2626'),
('task-002', '生产环境', '#F59E0B');

-- Task 003 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-003', '代码审查', '#8B5CF6'),
('task-003', '优先', '#EF4444');

-- Task 004 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-004', '性能', '#10B981'),
('task-004', '数据库', '#3B82F6');

-- Task 005 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-005', '测试', '#6366F1'),
('task-005', '质量保证', '#8B5CF6');

-- Task 006 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-006', '维护', '#6B7280'),
('task-006', '依赖更新', '#F59E0B');

-- Task 011 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-011', '认证', '#3B82F6'),
('task-011', '安全', '#EF4444'),
('task-011', '后端', '#10B981');

-- Task 012 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-012', '性能', '#10B981'),
('task-012', '优化', '#F59E0B'),
('task-012', '前端', '#3B82F6');

-- Task 013 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-013', '监控', '#8B5CF6'),
('task-013', '运维', '#6B7280');

-- Task 019 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-019', '安全', '#EF4444'),
('task-019', 'Bug', '#DC2626'),
('task-019', '已修复', '#10B981');

-- Task 020 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-020', '数据库', '#3B82F6'),
('task-020', '迁移', '#F59E0B'),
('task-020', '已完成', '#10B981');

-- Task 021 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-021', '发布', '#8B5CF6'),
('task-021', 'v1.0', '#6366F1'),
('task-021', '里程碑', '#EF4444');

-- Task 022 标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-022', 'CI/CD', '#3B82F6'),
('task-022', '自动化', '#10B981'),
('task-022', 'DevOps', '#6B7280');

-- ============================================
-- 5. 逾期任务示例（2 个）
-- ============================================

INSERT INTO tasks (id, title, description, status, priority, due_date, created_at, updated_at) VALUES
-- 逾期的高优先级任务
('task-031', '紧急修复客户反馈', '客户报告关键功能无法使用', 'pending', 'high', '2025-11-20 23:59:59+00', NOW() - INTERVAL '5 days', NOW()),
-- 逾期的中优先级任务
('task-032', '完成季度报告', '准备 Q4 季度总结报告', 'in_progress', 'medium', '2025-11-22 23:59:59+00', NOW() - INTERVAL '10 days', NOW());

-- 逾期任务标签
INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-031', '逾期', '#DC2626'),
('task-031', '紧急', '#EF4444'),
('task-031', '客户', '#F59E0B');

INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES
('task-032', '逾期', '#DC2626'),
('task-032', '报告', '#3B82F6'),
('task-032', '管理', '#6B7280');

-- ============================================
-- 总结
-- ============================================
-- 共 32 个任务：
-- - Pending: 10 个
-- - In Progress: 8 个
-- - Completed: 12 个
-- - 逾期: 2 个
--
-- 优先级分布：
-- - High: 11 个
-- - Medium: 12 个
-- - Low: 9 个
--
-- 标签示例：
-- - 文档、Bug、优先、紧急、性能、测试、安全、监控等
-- ============================================
