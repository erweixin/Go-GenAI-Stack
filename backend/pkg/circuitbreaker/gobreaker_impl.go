package circuitbreaker

import (
	"context"

	"github.com/sony/gobreaker"
)

// GobreakerCircuitBreaker 基于 gobreaker 的实现
type GobreakerCircuitBreaker struct {
	breaker *gobreaker.CircuitBreaker
	name    string
}

// NewCircuitBreaker 创建熔断器
//
// Example:
//
//	breaker := circuitbreaker.NewCircuitBreaker("payment_service", &circuitbreaker.Config{
//	    MaxRequests: 5,
//	    Interval:    time.Minute,
//	    Timeout:     30 * time.Second,
//	    ReadyToTrip: func(counts circuitbreaker.Counts) bool {
//	        failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
//	        return counts.Requests >= 10 && failureRatio >= 0.6
//	    },
//	    OnStateChange: func(name string, from, to circuitbreaker.State) {
//	        log.Printf("Circuit Breaker '%s' changed from %s to %s", name, from, to)
//	    },
//	})
func NewCircuitBreaker(name string, config *Config) *GobreakerCircuitBreaker {
	if config == nil {
		config = DefaultConfig()
	}

	settings := gobreaker.Settings{
		Name:        name,
		MaxRequests: config.MaxRequests,
		Interval:    config.Interval,
		Timeout:     config.Timeout,
		ReadyToTrip: func(counts gobreaker.Counts) bool {
			if config.ReadyToTrip == nil {
				return false
			}
			return config.ReadyToTrip(Counts{
				Requests:             counts.Requests,
				TotalSuccesses:       counts.TotalSuccesses,
				TotalFailures:        counts.TotalFailures,
				ConsecutiveSuccesses: counts.ConsecutiveSuccesses,
				ConsecutiveFailures:  counts.ConsecutiveFailures,
			})
		},
		OnStateChange: func(name string, from gobreaker.State, to gobreaker.State) {
			if config.OnStateChange != nil {
				config.OnStateChange(name, toState(from), toState(to))
			}
		},
	}

	return &GobreakerCircuitBreaker{
		breaker: gobreaker.NewCircuitBreaker(settings),
		name:    name,
	}
}

// Call 执行函数并应用熔断策略
func (g *GobreakerCircuitBreaker) Call(fn func() (interface{}, error)) (interface{}, error) {
	result, err := g.breaker.Execute(fn)
	if err == gobreaker.ErrOpenState {
		return nil, ErrOpenState
	}
	if err == gobreaker.ErrTooManyRequests {
		return nil, ErrTooManyRequests
	}
	return result, err
}

// CallWithContext 带上下文执行
func (g *GobreakerCircuitBreaker) CallWithContext(ctx context.Context, fn func(context.Context) (interface{}, error)) (interface{}, error) {
	return g.Call(func() (interface{}, error) {
		// 检查上下文是否已取消
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		return fn(ctx)
	})
}

// State 获取当前熔断器状态
func (g *GobreakerCircuitBreaker) State() State {
	return toState(g.breaker.State())
}

// Reset 重置熔断器
func (g *GobreakerCircuitBreaker) Reset() {
	// gobreaker 没有 Reset 方法，需要重新创建
	// 这里只是一个占位实现
}

// toState 转换 gobreaker 状态到本地状态
func toState(state gobreaker.State) State {
	switch state {
	case gobreaker.StateClosed:
		return StateClosed
	case gobreaker.StateOpen:
		return StateOpen
	case gobreaker.StateHalfOpen:
		return StateHalfOpen
	default:
		return StateClosed
	}
}

