-- schema.sql
-- 声明式数据库 Schema
-- 
-- 这是唯一的数据源（Single Source of Truth）
-- Atlas 会自动对比差异并生成迁移文件
-- 
-- 最佳实践：
-- 1. 只描述目标状态，不描述过程
-- 2. 使用清晰的注释
-- 3. 保持与 Go structs 同步
-- 4. 让 Atlas 处理迁移细节
-- 
-- 注意：表定义顺序很重要！
-- - 先定义函数（Functions）
-- - 再定义被引用的表（如 users）
-- - 最后定义引用其他表的表（如 tasks）

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
CREATE TABLE users (
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
CREATE UNIQUE INDEX idx_users_email ON users(LOWER(email));
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE email_verified = FALSE;

-- 注释
COMMENT ON TABLE users IS 'User domain - stores user accounts and profiles';
COMMENT ON COLUMN users.id IS 'User ID (UUID)';
COMMENT ON COLUMN users.email IS 'Email address (unique, case-insensitive)';
COMMENT ON COLUMN users.username IS 'Username (unique, optional, 3-30 chars)';
COMMENT ON COLUMN users.password_hash IS 'Password hash (bcrypt)';
COMMENT ON COLUMN users.full_name IS 'Full name (optional)';
COMMENT ON COLUMN users.avatar_url IS 'Avatar URL (optional)';
COMMENT ON COLUMN users.status IS 'User status: active, inactive, banned';
COMMENT ON COLUMN users.email_verified IS 'Whether email is verified';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN users.last_login_at IS 'Last login timestamp';

-- 触发器：自动更新 updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Task Domain Tables
-- ============================================

-- tasks 表：存储任务
CREATE TABLE tasks (
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
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_completed_at ON tasks(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- 注释
COMMENT ON TABLE tasks IS 'Task domain - stores todo/task items';
COMMENT ON COLUMN tasks.id IS 'Task ID (UUID)';
COMMENT ON COLUMN tasks.user_id IS 'User ID (foreign key to users table)';
COMMENT ON COLUMN tasks.title IS 'Task title (required, max 200 chars)';
COMMENT ON COLUMN tasks.description IS 'Task description (optional, text)';
COMMENT ON COLUMN tasks.status IS 'Task status: pending, in_progress, completed';
COMMENT ON COLUMN tasks.priority IS 'Task priority: low, medium, high';
COMMENT ON COLUMN tasks.due_date IS 'Due date (optional)';
COMMENT ON COLUMN tasks.created_at IS 'Creation timestamp';
COMMENT ON COLUMN tasks.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN tasks.completed_at IS 'Completion timestamp (only when status=completed)';

-- task_tags 表：存储任务标签（多对多关系）
CREATE TABLE task_tags (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    tag_color VARCHAR(10),
    
    PRIMARY KEY (task_id, tag_name),
    
    -- 约束
    CONSTRAINT task_tags_name_not_empty CHECK (LENGTH(TRIM(tag_name)) > 0)
);

-- 索引
CREATE INDEX idx_task_tags_tag_name ON task_tags(tag_name);

-- 注释
COMMENT ON TABLE task_tags IS 'Task tags - many-to-many relationship between tasks and tags';
COMMENT ON COLUMN task_tags.task_id IS 'Task ID (foreign key)';
COMMENT ON COLUMN task_tags.tag_name IS 'Tag name (max 50 chars)';
COMMENT ON COLUMN task_tags.tag_color IS 'Tag color (hex code, e.g. #FF5733)';

-- ============================================
-- Extension Points (commented out, for reference)
-- ============================================

-- LLM Domain (未实现)
-- CREATE TABLE llm_models (
--     id UUID PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     provider VARCHAR(50) NOT NULL,
--     pricing_input DECIMAL(10, 6),
--     pricing_output DECIMAL(10, 6),
--     created_at TIMESTAMPTZ NOT NULL
-- );

-- Monitoring Domain (未实现)
-- CREATE TABLE metrics (
--     id UUID PRIMARY KEY,
--     metric_name VARCHAR(100) NOT NULL,
--     metric_value DECIMAL(20, 6) NOT NULL,
--     tags JSONB,
--     timestamp TIMESTAMPTZ NOT NULL
-- );

-- 为 tasks 表添加触发器
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views (可选)
-- ============================================

-- 逾期任务视图
CREATE VIEW overdue_tasks AS
SELECT 
    id,
    user_id,
    title,
    priority,
    due_date,
    created_at,
    (CURRENT_TIMESTAMP - due_date) AS overdue_duration
FROM tasks
WHERE status != 'completed'
  AND due_date IS NOT NULL
  AND due_date < CURRENT_TIMESTAMP
ORDER BY due_date ASC;

COMMENT ON VIEW overdue_tasks IS 'View of overdue tasks (未完成且已过期)';

-- 任务统计视图
CREATE VIEW task_statistics AS
SELECT
    status,
    priority,
    COUNT(*) AS count,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) AS avg_duration_seconds
FROM tasks
GROUP BY status, priority;

COMMENT ON VIEW task_statistics IS 'Task statistics by status and priority';
