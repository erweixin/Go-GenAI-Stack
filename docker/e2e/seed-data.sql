-- E2E 测试环境测试数据
-- 用途：为 E2E 测试提供测试数据
-- 说明：Schema 由 backend/database/schema.sql 统一管理
-- 
-- 依赖：需要先执行 schema.sql

-- ============================================
-- 确保扩展已启用
-- ============================================
-- pgcrypto 提供 gen_random_uuid() 函数
-- PostgreSQL 13+ 已内置，但为了兼容性还是显式启用
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 插入测试数据
-- ============================================

-- E2E 测试用户
-- Email: e2e-test@example.com
-- Password: Test123456!
-- Hash: bcrypt hash of "Test123456!"
INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    full_name,
    status,
    created_at,
    updated_at,
    last_login_at
) VALUES (
    gen_random_uuid(),
    'e2e-test@example.com',
    'e2e-test-user',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye6YI0yGz3dGS2XN9p0ZEd7tOLJ1R0PbW',
    'E2E Test User',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 注意：llm_models 表在 schema.sql 中未实现，跳过

-- 插入测试任务
INSERT INTO tasks (
    id,
    user_id,
    title,
    description,
    status,
    priority,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    u.id,
    'E2E 测试任务',
    '这是一个用于端到端测试的测试任务',
    'pending',
    'high',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u 
WHERE u.email = 'e2e-test@example.com'
LIMIT 1;

