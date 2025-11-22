package queue

import (
	"context"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
)

// AsyncQueue 异步队列接口
type AsyncQueue interface {
	// Enqueue 入队任务
	Enqueue(taskType string, payload []byte, opts ...asynq.Option) error

	// EnqueueContext 带上下文的入队
	EnqueueContext(ctx context.Context, taskType string, payload []byte, opts ...asynq.Option) error

	// RegisterHandler 注册任务处理器
	RegisterHandler(taskType string, handler func(context.Context, []byte) error)

	// Start 启动队列处理器
	Start() error

	// Shutdown 关闭队列
	Shutdown() error
}

// AsynqClient Asynq 客户端实现
type AsynqClient struct {
	client     *asynq.Client
	server     *asynq.Server
	mux        *asynq.ServeMux
	config     *Config
}

// Config 队列配置
type Config struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	Concurrency   int // 并发处理任务数
	Queues        map[string]int // 队列优先级 {"critical": 6, "default": 3, "low": 1}
}

// NewAsynqClient 创建新的 Asynq 客户端
//
// Example:
//
//	config := &Config{
//	    RedisAddr:   "localhost:6379",
//	    Concurrency: 10,
//	    Queues: map[string]int{
//	        "critical": 6,
//	        "default":  3,
//	        "low":      1,
//	    },
//	}
//	queue, err := NewAsynqClient(config)
//	queue.RegisterHandler("send_email", handleSendEmail)
//	queue.Start()
func NewAsynqClient(config *Config) (*AsynqClient, error) {
	// 创建 Redis 连接配置
	redisOpt := asynq.RedisClientOpt{
		Addr:     config.RedisAddr,
		Password: config.RedisPassword,
		DB:       config.RedisDB,
	}

	// 创建客户端（用于入队任务）
	client := asynq.NewClient(redisOpt)

	// 创建服务器（用于处理任务）
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: config.Concurrency,
			Queues:      config.Queues,
			ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
				// TODO: 记录错误日志
				fmt.Printf("Task %s failed: %v\n", task.Type(), err)
			}),
			RetryDelayFunc: func(n int, err error, task *asynq.Task) time.Duration {
				// 指数退避：1s, 2s, 4s, 8s, ...
				return time.Duration(1<<uint(n)) * time.Second
			},
		},
	)

	// 创建任务处理器复用器
	mux := asynq.NewServeMux()

	return &AsynqClient{
		client: client,
		server: server,
		mux:    mux,
		config: config,
	}, nil
}

// Enqueue 入队任务
//
// Example:
//
//	err := queue.Enqueue("send_email", []byte(`{"to":"user@example.com"}`))
func (q *AsynqClient) Enqueue(taskType string, payload []byte, opts ...asynq.Option) error {
	task := asynq.NewTask(taskType, payload, opts...)
	info, err := q.client.Enqueue(task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	fmt.Printf("Enqueued task: type=%s id=%s queue=%s\n", task.Type(), info.ID, info.Queue)
	return nil
}

// EnqueueContext 带上下文的入队
func (q *AsynqClient) EnqueueContext(ctx context.Context, taskType string, payload []byte, opts ...asynq.Option) error {
	task := asynq.NewTask(taskType, payload, opts...)
	info, err := q.client.EnqueueContext(ctx, task)
	if err != nil {
		return fmt.Errorf("failed to enqueue task: %w", err)
	}

	fmt.Printf("Enqueued task: type=%s id=%s queue=%s\n", task.Type(), info.ID, info.Queue)
	return nil
}

// RegisterHandler 注册任务处理器
//
// Example:
//
//	queue.RegisterHandler("send_email", func(ctx context.Context, payload []byte) error {
//	    // 处理发送邮件任务
//	    return nil
//	})
func (q *AsynqClient) RegisterHandler(taskType string, handler func(context.Context, []byte) error) {
	q.mux.HandleFunc(taskType, func(ctx context.Context, task *asynq.Task) error {
		return handler(ctx, task.Payload())
	})
}

// Start 启动队列处理器
func (q *AsynqClient) Start() error {
	fmt.Printf("Starting async queue processor with %d workers...\n", q.config.Concurrency)
	
	// 在后台启动服务器
	if err := q.server.Start(q.mux); err != nil {
		return fmt.Errorf("failed to start queue server: %w", err)
	}

	return nil
}

// Shutdown 关闭队列
func (q *AsynqClient) Shutdown() error {
	fmt.Println("Shutting down async queue...")

	// 关闭服务器（等待所有任务完成）
	q.server.Shutdown()

	// 关闭客户端
	if err := q.client.Close(); err != nil {
		return fmt.Errorf("failed to close queue client: %w", err)
	}

	return nil
}

// DefaultQueues 默认队列配置
func DefaultQueues() map[string]int {
	return map[string]int{
		"critical": 6, // 最高优先级
		"default":  3, // 默认优先级
		"low":      1, // 最低优先级
	}
}

// 常用的任务选项

// WithQueue 指定任务队列
func WithQueue(queue string) asynq.Option {
	return asynq.Queue(queue)
}

// WithMaxRetry 指定最大重试次数
func WithMaxRetry(n int) asynq.Option {
	return asynq.MaxRetry(n)
}

// WithTimeout 指定任务超时时间
func WithTimeout(d time.Duration) asynq.Option {
	return asynq.Timeout(d)
}

// WithProcessIn 延迟执行
func WithProcessIn(d time.Duration) asynq.Option {
	return asynq.ProcessIn(d)
}

// WithProcessAt 在指定时间执行
func WithProcessAt(t time.Time) asynq.Option {
	return asynq.ProcessAt(t)
}

// WithDeadline 指定任务截止时间
func WithDeadline(t time.Time) asynq.Option {
	return asynq.Deadline(t)
}

