package bootstrap

import (
	"context"
	"fmt"
	"log"

	"github.com/erweixin/go-genai-stack/backend/infrastructure/config"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/logger"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/metrics"
	"github.com/erweixin/go-genai-stack/backend/infrastructure/monitoring/tracing"
)

// InitObservability 初始化可观测性组件
//
// 按顺序初始化：
//  1. Logger（结构化日志）
//  2. Metrics（Prometheus 指标）
//  3. Tracing（OpenTelemetry 追踪）
//
// Example:
//
//	err := bootstrap.InitObservability(ctx, cfg)
//	if err != nil {
//	    log.Fatalf("初始化可观测性组件失败: %v", err)
//	}
func InitObservability(ctx context.Context, cfg *config.Config) error {
	// 1. 初始化 Logger
	if err := initLogger(cfg); err != nil {
		return fmt.Errorf("初始化 Logger 失败: %w", err)
	}

	// 2. 初始化 Metrics
	initMetrics(cfg)

	// 3. 初始化 Tracing
	if err := initTracing(ctx, cfg); err != nil {
		return fmt.Errorf("初始化 Tracing 失败: %w", err)
	}

	return nil
}

// initLogger 初始化结构化日志
func initLogger(cfg *config.Config) error {
	if !cfg.Logging.Enabled {
		log.Println("[Observability] Logger 已禁用，使用标准 log")
		return nil
	}

	if err := logger.InitGlobalLogger(cfg.Logging); err != nil {
		return err
	}

	log.Printf("[Observability] Logger 已启用（Level=%s, Format=%s, Output=%s）",
		cfg.Logging.Level,
		cfg.Logging.Format,
		cfg.Logging.Output,
	)

	// 使用结构化日志输出启动信息
	if globalLogger := logger.GetGlobalLogger(); globalLogger != nil {
		globalLogger.Info("结构化日志已启动")
	}

	return nil
}

// initMetrics 初始化 Prometheus Metrics
func initMetrics(cfg *config.Config) {
	if !cfg.Monitoring.MetricsEnabled {
		log.Println("[Observability] Metrics 已禁用")
		return
	}

	metrics.InitGlobalMetrics(cfg.Monitoring)

	log.Printf("[Observability] Metrics 已启用（Path=%s）",
		cfg.Monitoring.MetricsPath,
	)

	// 使用结构化日志输出启动信息
	if globalLogger := logger.GetGlobalLogger(); globalLogger != nil {
		globalLogger.Info("Prometheus Metrics 已启动")
	}
}

// initTracing 初始化 OpenTelemetry Tracing
func initTracing(ctx context.Context, cfg *config.Config) error {
	if !cfg.Monitoring.TracingEnabled {
		log.Println("[Observability] Tracing 已禁用")
		return nil
	}

	if err := tracing.InitGlobalTracer(ctx, cfg.Monitoring); err != nil {
		return err
	}

	log.Printf("[Observability] Tracing 已启用（Type=%s, Endpoint=%s, SampleRate=%.2f）",
		cfg.Monitoring.TracingType,
		cfg.Monitoring.TracingEndpoint,
		cfg.Monitoring.SampleRate,
	)

	// 使用结构化日志输出启动信息
	if globalLogger := logger.GetGlobalLogger(); globalLogger != nil {
		globalLogger.Info("OpenTelemetry Tracing 已启动")
	}

	return nil
}

// ShutdownObservability 关闭可观测性组件
//
// 应在应用退出前调用，确保所有数据被正确导出
//
// Example:
//
//	defer bootstrap.ShutdownObservability(ctx)
func ShutdownObservability(ctx context.Context) {
	// 1. 刷新 Logger
	if err := logger.Sync(); err != nil {
		log.Printf("[Observability] 刷新 Logger 失败: %v", err)
	} else {
		log.Println("[Observability] Logger 已关闭")
	}

	// 2. 关闭 Tracing
	if err := tracing.ShutdownGlobalTracer(ctx); err != nil {
		log.Printf("[Observability] 关闭 Tracing 失败: %v", err)
	} else {
		if tracing.GetGlobalTracer() != nil {
			log.Println("[Observability] Tracing 已关闭")
		}
	}
}
