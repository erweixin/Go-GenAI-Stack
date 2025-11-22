package circuitbreaker

import (
	"context"
	"errors"
	"time"
)

// CircuitBreaker 熔断器接口
//
// 当下游服务出现故障时，自动熔断，避免雪崩效应
type CircuitBreaker interface {
	// Call 执行函数并应用熔断策略
	Call(fn func() (interface{}, error)) (interface{}, error)

	// CallWithContext 带上下文执行
	CallWithContext(ctx context.Context, fn func(context.Context) (interface{}, error)) (interface{}, error)

	// State 获取当前熔断器状态
	State() State

	// Reset 重置熔断器
	Reset()
}

// State 熔断器状态
type State int

const (
	// StateClosed 闭合状态（正常）
	// 请求正常通过，统计失败率
	StateClosed State = iota

	// StateOpen 打开状态（熔断）
	// 所有请求直接失败，不调用下游服务
	StateOpen

	// StateHalfOpen 半开状态（探测）
	// 允许少量请求通过，测试下游是否恢复
	StateHalfOpen
)

// String 状态转字符串
func (s State) String() string {
	switch s {
	case StateClosed:
		return "CLOSED"
	case StateOpen:
		return "OPEN"
	case StateHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}

// Config 熔断器配置
type Config struct {
	// MaxRequests 半开状态下允许的最大请求数
	MaxRequests uint32

	// Interval 统计周期
	// 在此周期内统计失败率
	Interval time.Duration

	// Timeout 超时时间
	// 超过此时间从打开状态进入半开状态
	Timeout time.Duration

	// ReadyToTrip 判断是否应该熔断的函数
	// 返回 true 表示应该从闭合状态进入打开状态
	ReadyToTrip func(counts Counts) bool

	// OnStateChange 状态变化回调
	OnStateChange func(name string, from State, to State)
}

// Counts 统计计数
type Counts struct {
	// Requests 总请求数
	Requests uint32

	// TotalSuccesses 总成功数
	TotalSuccesses uint32

	// TotalFailures 总失败数
	TotalFailures uint32

	// ConsecutiveSuccesses 连续成功数
	ConsecutiveSuccesses uint32

	// ConsecutiveFailures 连续失败数
	ConsecutiveFailures uint32
}

// FailureRate 失败率
func (c Counts) FailureRate() float64 {
	if c.Requests == 0 {
		return 0
	}
	return float64(c.TotalFailures) / float64(c.Requests)
}

// Errors
var (
	// ErrOpenState 熔断器打开
	ErrOpenState = errors.New("circuit breaker is open")

	// ErrTooManyRequests 半开状态请求过多
	ErrTooManyRequests = errors.New("too many requests in half-open state")
)

// DefaultConfig 默认配置
func DefaultConfig() *Config {
	return &Config{
		MaxRequests: 5,
		Interval:    time.Minute,
		Timeout:     time.Minute,
		ReadyToTrip: func(counts Counts) bool {
			// 失败率超过 50% 或连续失败 5 次
			return counts.FailureRate() >= 0.5 || counts.ConsecutiveFailures >= 5
		},
	}
}

// Example 使用示例
//
//	// 创建熔断器
//	breaker := circuitbreaker.NewCircuitBreaker("api_service", &circuitbreaker.Config{
//	    MaxRequests: 5,
//	    Interval:    time.Minute,
//	    Timeout:     time.Minute,
//	    ReadyToTrip: func(counts circuitbreaker.Counts) bool {
//	        return counts.FailureRate() >= 0.6
//	    },
//	})
//
//	// 使用熔断器
//	result, err := breaker.Call(func() (interface{}, error) {
//	    return callDownstreamService()
//	})
//	if err == circuitbreaker.ErrOpenState {
//	    // 熔断器打开，返回降级响应
//	    return fallbackResponse()
//	}
func Example() {}

