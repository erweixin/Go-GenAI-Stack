-- Node.js 后端调试环境测试数据
-- 用途：为 Node.js 后端开发环境提供测试数据
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

-- Node.js 后端调试测试用户
-- Email: nodejs-debug@example.com
-- Password: Nodejs123456!
-- Hash: bcrypt hash of "Nodejs123456!" (cost 10)
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
    'nodejs-debug@example.com',
    'nodejs_debug_user',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Backend123456!
    'Node.js Debug User',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- 插入一些测试任务（关联到上面的用户）
-- 注意：需要先获取用户 ID
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- 获取测试用户 ID
    SELECT id INTO test_user_id FROM users WHERE email = 'nodejs-debug@example.com';
    
    IF test_user_id IS NOT NULL THEN
        -- 插入测试任务
        INSERT INTO tasks (
            id,
            user_id,
            title,
            description,
            status,
            priority,
            due_date,
            created_at,
            updated_at
        ) VALUES
        (
            gen_random_uuid(),
            test_user_id,
            'Node.js 后端开发任务',
            '完成 Node.js 后端的 Redis 集成',
            'in_progress',
            'high',
            CURRENT_TIMESTAMP + INTERVAL '7 days',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ),
        (
            gen_random_uuid(),
            test_user_id,
            '测试健康检查端点',
            '验证 /health 端点是否正确检查 Redis 状态',
            'pending',
            'medium',
            CURRENT_TIMESTAMP + INTERVAL '3 days',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ),
        (
            gen_random_uuid(),
            test_user_id,
            '完成 Docker 环境配置',
            '创建 backend-nodejs-debug 环境',
            'completed',
            'high',
            CURRENT_TIMESTAMP - INTERVAL '1 day',
            CURRENT_TIMESTAMP - INTERVAL '2 days',
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

