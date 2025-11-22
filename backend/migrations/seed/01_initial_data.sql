-- 01_initial_data.sql
-- 初始化数据（种子数据）
-- 
-- 这些数据会在首次部署时插入
-- 后续环境可以通过这个文件快速初始化

-- ============================================
-- LLM Models - 初始模型配置
-- ============================================

INSERT INTO models (
    id, 
    name, 
    provider, 
    max_tokens, 
    input_price_per_token, 
    output_price_per_token,
    currency,
    status,
    health_score
) VALUES 
    -- OpenAI Models
    (
        'gpt-4o', 
        'GPT-4o', 
        'openai', 
        128000, 
        0.00000500, 
        0.00001500,
        'USD',
        'active',
        100.00
    ),
    (
        'gpt-4o-mini', 
        'GPT-4o Mini', 
        'openai', 
        128000, 
        0.00000015, 
        0.00000060,
        'USD',
        'active',
        100.00
    ),
    (
        'gpt-4-turbo', 
        'GPT-4 Turbo', 
        'openai', 
        128000, 
        0.00001000, 
        0.00003000,
        'USD',
        'active',
        95.00
    ),
    (
        'gpt-3.5-turbo', 
        'GPT-3.5 Turbo', 
        'openai', 
        16385, 
        0.00000050, 
        0.00000150,
        'USD',
        'active',
        98.00
    ),
    
    -- Anthropic Models
    (
        'claude-3.5-sonnet', 
        'Claude 3.5 Sonnet', 
        'anthropic', 
        200000, 
        0.00000300, 
        0.00001500,
        'USD',
        'active',
        100.00
    ),
    (
        'claude-3-opus', 
        'Claude 3 Opus', 
        'anthropic', 
        200000, 
        0.00001500, 
        0.00007500,
        'USD',
        'active',
        98.00
    ),
    (
        'claude-3-sonnet', 
        'Claude 3 Sonnet', 
        'anthropic', 
        200000, 
        0.00000300, 
        0.00001500,
        'USD',
        'active',
        97.00
    ),
    (
        'claude-3-haiku', 
        'Claude 3 Haiku', 
        'anthropic', 
        200000, 
        0.00000025, 
        0.00000125,
        'USD',
        'active',
        99.00
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 验证数据插入
-- ============================================

DO $$
DECLARE
    model_count INT;
BEGIN
    SELECT COUNT(*) INTO model_count FROM models;
    RAISE NOTICE 'Inserted % models', model_count;
END $$;

