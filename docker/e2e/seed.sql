-- E2E 测试数据种子文件
-- 用途：为 E2E 测试环境初始化测试用户和数据
-- 执行时机：数据库容器首次启动时自动执行
-- 
-- 基于: backend/database/schema.sql

-- ============================================
-- Functions and Triggers
-- ============================================

-- 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- User Domain Tables
-- ============================================

-- users 表：存储用户账户信息
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'banned')),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_login_at TIMESTAMPTZ,
    
    -- 约束
    CONSTRAINT users_email_not_empty CHECK (LENGTH(TRIM(email)) > 0),
    CONSTRAINT users_password_hash_not_empty CHECK (LENGTH(TRIM(password_hash)) > 0),
    CONSTRAINT users_username_format CHECK (username IS NULL OR (LENGTH(username) >= 3 AND LENGTH(username) <= 30))
);

-- 索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = FALSE;

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Task Domain Tables
-- ============================================

-- tasks 表：存储任务
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- 约束
    CONSTRAINT tasks_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT tasks_due_date_after_created CHECK (due_date IS NULL OR due_date >= created_at),
    CONSTRAINT tasks_completed_at_consistency CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed' AND completed_at IS NULL)
    )
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- task_tags 表：存储任务标签
CREATE TABLE IF NOT EXISTS task_tags (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    tag_color VARCHAR(10),
    
    PRIMARY KEY (task_id, tag_name),
    
    -- 约束
    CONSTRAINT task_tags_name_not_empty CHECK (LENGTH(TRIM(tag_name)) > 0)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_name ON task_tags(tag_name);

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 插入测试数据
-- ============================================

-- 测试用户
-- Email: e2e-test@example.com
-- Password: Test123456!
-- Hash: bcrypt hash of "Test123456!"
INSERT INTO users (
    id,
    email,
    password_hash,
    username,
    full_name,
    status,
    email_verified,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'e2e-test@example.com',
    '$2a$10$VI4AlPNyf1.n2t77hSUKzeU9McGcJl.SvX8c.uRh471fUVQ8wMpEW',
    'e2euser',
    'E2E Test User',
    'active',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 示例任务（可选，用于测试任务列表）
INSERT INTO tasks (
    id,
    user_id,
    title,
    description,
    status,
    priority,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Sample Task for E2E Testing',
    'This is a pre-existing task for testing purposes',
    'pending',
    'medium',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 验证数据
-- ============================================

DO $$
DECLARE
    user_count INTEGER;
    task_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users WHERE email = 'e2e-test@example.com';
    SELECT COUNT(*) INTO task_count FROM tasks WHERE user_id = '00000000-0000-0000-0000-000000000001';
    
    RAISE NOTICE '✅ E2E seed data initialized:';
    RAISE NOTICE '   - Test users: %', user_count;
    RAISE NOTICE '   - Sample tasks: %', task_count;
    RAISE NOTICE '   - Test user email: e2e-test@example.com';
    RAISE NOTICE '   - Test user password: Test123456!';
END $$;
