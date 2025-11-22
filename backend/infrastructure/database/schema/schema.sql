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

-- ============================================
-- Chat Domain Tables
-- ============================================

-- conversations 表：存储对话会话
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT conversations_title_length CHECK (LENGTH(title) <= 200)
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

COMMENT ON TABLE conversations IS 'Chat conversations - stores user conversation sessions';
COMMENT ON COLUMN conversations.id IS 'Conversation ID (UUID)';
COMMENT ON COLUMN conversations.user_id IS 'User ID who owns this conversation';
COMMENT ON COLUMN conversations.title IS 'Conversation title';
COMMENT ON COLUMN conversations.created_at IS 'Creation timestamp';
COMMENT ON COLUMN conversations.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN conversations.deleted_at IS 'Soft delete timestamp';

-- messages 表：存储对话消息
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
    content TEXT NOT NULL,
    tokens INT NOT NULL DEFAULT 0,
    model VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT messages_tokens_positive CHECK (tokens >= 0),
    CONSTRAINT messages_content_not_empty CHECK (LENGTH(content) > 0)
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_model ON messages(model) WHERE model IS NOT NULL;
CREATE INDEX idx_messages_metadata ON messages USING GIN (metadata);

COMMENT ON TABLE messages IS 'Chat messages - stores individual messages in conversations';
COMMENT ON COLUMN messages.id IS 'Message ID (UUID)';
COMMENT ON COLUMN messages.conversation_id IS 'Parent conversation ID';
COMMENT ON COLUMN messages.role IS 'Message role (user/assistant/system/function)';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.tokens IS 'Token count for this message';
COMMENT ON COLUMN messages.model IS 'LLM model used to generate this message';
COMMENT ON COLUMN messages.metadata IS 'Additional metadata in JSON format';
COMMENT ON COLUMN messages.created_at IS 'Creation timestamp';

-- ============================================
-- LLM Domain Tables
-- ============================================

-- models 表：存储 LLM 模型配置
CREATE TABLE models (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'local', 'eino')),
    max_tokens INT NOT NULL CHECK (max_tokens > 0),
    input_price_per_token DECIMAL(10, 8) NOT NULL DEFAULT 0 CHECK (input_price_per_token >= 0),
    output_price_per_token DECIMAL(10, 8) NOT NULL DEFAULT 0 CHECK (output_price_per_token >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    health_score DECIMAL(5, 2) DEFAULT 100.00 CHECK (health_score >= 0 AND health_score <= 100),
    avg_latency_ms INT DEFAULT 0 CHECK (avg_latency_ms >= 0),
    success_rate DECIMAL(5, 4) DEFAULT 1.0000 CHECK (success_rate >= 0 AND success_rate <= 1),
    total_calls BIGINT DEFAULT 0 CHECK (total_calls >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT models_name_not_empty CHECK (LENGTH(name) > 0)
);

CREATE INDEX idx_models_provider ON models(provider);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_models_health_score ON models(health_score DESC) WHERE status = 'active';
CREATE INDEX idx_models_avg_latency ON models(avg_latency_ms ASC) WHERE status = 'active';

COMMENT ON TABLE models IS 'LLM models - stores available model configurations';
COMMENT ON COLUMN models.id IS 'Model ID (e.g., gpt-4o)';
COMMENT ON COLUMN models.name IS 'Model display name';
COMMENT ON COLUMN models.provider IS 'Model provider';
COMMENT ON COLUMN models.max_tokens IS 'Maximum token limit';
COMMENT ON COLUMN models.input_price_per_token IS 'Price per input token';
COMMENT ON COLUMN models.output_price_per_token IS 'Price per output token';
COMMENT ON COLUMN models.currency IS 'Currency code';
COMMENT ON COLUMN models.status IS 'Model status';
COMMENT ON COLUMN models.health_score IS 'Health score (0-100)';
COMMENT ON COLUMN models.avg_latency_ms IS 'Average response latency in milliseconds';
COMMENT ON COLUMN models.success_rate IS 'Success rate (0-1)';
COMMENT ON COLUMN models.total_calls IS 'Total number of API calls';

-- ============================================
-- Monitoring Domain Tables
-- ============================================

-- metrics 表：存储性能和业务指标（时序数据）
CREATE TABLE metrics (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('counter', 'gauge', 'histogram')),
    value DOUBLE PRECISION NOT NULL,
    labels JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT metrics_name_not_empty CHECK (LENGTH(name) > 0)
);

CREATE INDEX idx_metrics_name_timestamp ON metrics(name, timestamp DESC);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX idx_metrics_labels ON metrics USING GIN (labels);

COMMENT ON TABLE metrics IS 'Metrics - stores performance and business metrics (time-series data)';
COMMENT ON COLUMN metrics.name IS 'Metric name (e.g., chat.messages.sent)';
COMMENT ON COLUMN metrics.type IS 'Metric type (counter/gauge/histogram)';
COMMENT ON COLUMN metrics.value IS 'Metric value';
COMMENT ON COLUMN metrics.labels IS 'Metric labels in JSON format';
COMMENT ON COLUMN metrics.timestamp IS 'Timestamp of the metric';

-- traces 表：存储分布式追踪链路
CREATE TABLE traces (
    id BIGSERIAL PRIMARY KEY,
    trace_id VARCHAR(100) NOT NULL,
    span_id VARCHAR(100) NOT NULL,
    parent_span_id VARCHAR(100),
    operation VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    duration_ms INT NOT NULL CHECK (duration_ms >= 0),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
    tags JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT traces_operation_not_empty CHECK (LENGTH(operation) > 0),
    CONSTRAINT traces_trace_span_unique UNIQUE (trace_id, span_id)
);

CREATE INDEX idx_traces_trace_id ON traces(trace_id);
CREATE INDEX idx_traces_start_time ON traces(start_time DESC);
CREATE INDEX idx_traces_operation ON traces(operation);
CREATE INDEX idx_traces_status ON traces(status);
CREATE INDEX idx_traces_duration ON traces(duration_ms DESC);
CREATE INDEX idx_traces_tags ON traces USING GIN (tags);

COMMENT ON TABLE traces IS 'Traces - stores distributed tracing spans (time-series data)';
COMMENT ON COLUMN traces.trace_id IS 'Trace ID (globally unique)';
COMMENT ON COLUMN traces.span_id IS 'Span ID (unique within trace)';
COMMENT ON COLUMN traces.parent_span_id IS 'Parent span ID';
COMMENT ON COLUMN traces.operation IS 'Operation name (e.g., chat.SendMessage)';
COMMENT ON COLUMN traces.start_time IS 'Span start time';
COMMENT ON COLUMN traces.duration_ms IS 'Duration in milliseconds';
COMMENT ON COLUMN traces.status IS 'Span status';
COMMENT ON COLUMN traces.tags IS 'Span tags in JSON format';
COMMENT ON COLUMN traces.error_message IS 'Error message if status is error';

-- cost_records 表：存储 LLM 调用成本记录
CREATE TABLE cost_records (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens INT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    total_tokens INT NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (input_cost >= 0),
    output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (output_cost >= 0),
    total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT cost_records_user_not_empty CHECK (LENGTH(user_id) > 0),
    CONSTRAINT cost_records_model_not_empty CHECK (LENGTH(model) > 0),
    CONSTRAINT cost_records_tokens_consistent CHECK (total_tokens = input_tokens + output_tokens),
    CONSTRAINT cost_records_cost_consistent CHECK (total_cost >= (input_cost + output_cost) - 0.000001)
);

CREATE INDEX idx_cost_records_user_id ON cost_records(user_id);
CREATE INDEX idx_cost_records_conversation_id ON cost_records(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_cost_records_model ON cost_records(model);
CREATE INDEX idx_cost_records_created_at ON cost_records(created_at DESC);
CREATE INDEX idx_cost_records_total_cost ON cost_records(total_cost DESC);
CREATE INDEX idx_cost_records_metadata ON cost_records USING GIN (metadata);

COMMENT ON TABLE cost_records IS 'Cost records - stores LLM API call costs';
COMMENT ON COLUMN cost_records.user_id IS 'User ID';
COMMENT ON COLUMN cost_records.conversation_id IS 'Related conversation ID';
COMMENT ON COLUMN cost_records.message_id IS 'Related message ID';
COMMENT ON COLUMN cost_records.model IS 'Model name used';
COMMENT ON COLUMN cost_records.input_tokens IS 'Input token count';
COMMENT ON COLUMN cost_records.output_tokens IS 'Output token count';
COMMENT ON COLUMN cost_records.total_tokens IS 'Total token count';
COMMENT ON COLUMN cost_records.input_cost IS 'Input cost';
COMMENT ON COLUMN cost_records.output_cost IS 'Output cost';
COMMENT ON COLUMN cost_records.total_cost IS 'Total cost';
COMMENT ON COLUMN cost_records.currency IS 'Currency code';
COMMENT ON COLUMN cost_records.metadata IS 'Additional metadata';

-- ============================================
-- Views and Materialized Views
-- ============================================

-- user_daily_costs 物化视图：用户每日成本汇总
CREATE MATERIALIZED VIEW user_daily_costs AS
SELECT 
    user_id,
    DATE(created_at) as date,
    model,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(total_tokens) as total_tokens,
    SUM(total_cost) as total_cost,
    COUNT(*) as call_count
FROM cost_records
GROUP BY user_id, DATE(created_at), model;

CREATE INDEX idx_user_daily_costs_user_date ON user_daily_costs(user_id, date DESC);
CREATE INDEX idx_user_daily_costs_model ON user_daily_costs(model);

COMMENT ON MATERIALIZED VIEW user_daily_costs IS 'User daily cost summary - aggregated by user, date, and model';

-- ============================================
-- Functions and Triggers
-- ============================================

-- 自动更新 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 conversations 表添加触发器
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为 models 表添加触发器
CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

