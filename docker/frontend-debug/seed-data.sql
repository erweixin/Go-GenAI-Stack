-- 前端调试环境测试数据
-- 用途：为前端开发环境提供测试数据
-- 说明：Schema 由 backend/database/schema.sql 统一管理
-- 
-- 依赖：需要先执行 schema.sql

-- ============================================
-- 确保扩展已启用
-- ============================================
-- pgcrypto 提供 gen_random_uuid() 函数
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 插入测试数据
-- ============================================

-- 前端调试测试用户
-- Email: frontend-debug@example.com
-- Password: Frontend123456!
-- Hash: bcrypt hash of "Frontend123456!"
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
    'frontend-debug@example.com',
    'frontend-debug-user',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye6YI0yGz3dGS2XN9p0ZEd7tOLJ1R0PbW',
    'Frontend Debug User',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 插入测试 LLM 模型配置
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
    'Frontend Debug 测试任务',
    '这是一个用于前端调试的测试任务',
    'pending',
    'medium',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u 
WHERE u.email = 'frontend-debug@example.com'
LIMIT 1;

