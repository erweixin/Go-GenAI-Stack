package tracing

import (
	"context"
	"fmt"
	"time"

	"github.com/erweixin/go-genai-stack/infrastructure/config"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"
)

// Tracer OpenTelemetry 追踪器
//
// 功能：
//   - 分布式链路追踪
//   - 支持 OTLP、Jaeger、Stdout 导出器
//   - 支持采样率控制
//   - 支持 Trace 上下文传播
type Tracer struct {
	provider *sdktrace.TracerProvider
	tracer   trace.Tracer
	enabled  bool
	config   config.MonitoringConfig
}

// NewTracer 创建 Tracer 实例
//
// 当 config.TracingEnabled = false 时，返回 nil（禁用 Tracing）
//
// Example:
//
//	tracer, err := NewTracer(ctx, cfg.Monitoring)
//	if err != nil {
//	    log.Fatalf("Failed to create tracer: %v", err)
//	}
//	defer tracer.Shutdown(ctx)
func NewTracer(ctx context.Context, cfg config.MonitoringConfig) (*Tracer, error) {
	if !cfg.TracingEnabled {
		return nil, nil // 禁用 Tracing
	}

	// 1. 创建 Exporter
	exporter, err := createExporter(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("创建 Exporter 失败: %w", err)
	}

	// 2. 创建 Resource（服务信息）
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName("go-genai-stack"),
			semconv.ServiceVersion("1.0.0"),
			attribute.String("environment", "production"),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("创建 Resource 失败: %w", err)
	}

	// 3. 创建 TracerProvider
	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sdktrace.TraceIDRatioBased(cfg.SampleRate)),
	)

	// 4. 设置全局 TracerProvider
	otel.SetTracerProvider(provider)

	// 5. 设置全局 Propagator（用于跨服务传播 Trace 上下文）
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	// 6. 创建 Tracer
	tracer := provider.Tracer("go-genai-stack")

	return &Tracer{
		provider: provider,
		tracer:   tracer,
		enabled:  true,
		config:   cfg,
	}, nil
}

// createExporter 创建 Trace Exporter
func createExporter(ctx context.Context, cfg config.MonitoringConfig) (sdktrace.SpanExporter, error) {
	switch cfg.TracingType {
	case "otlp":
		// OTLP gRPC Exporter (支持 Jaeger, Tempo, OpenTelemetry Collector)
		client := otlptracegrpc.NewClient(
			otlptracegrpc.WithEndpoint(cfg.TracingEndpoint),
			otlptracegrpc.WithInsecure(), // 生产环境应使用 TLS
		)
		exporter, err := otlptrace.New(ctx, client)
		if err != nil {
			return nil, fmt.Errorf("创建 OTLP Exporter 失败: %w", err)
		}
		return exporter, nil

	case "stdout":
		// Stdout Exporter（用于开发调试）
		exporter, err := stdouttrace.New(
			stdouttrace.WithPrettyPrint(),
		)
		if err != nil {
			return nil, fmt.Errorf("创建 Stdout Exporter 失败: %w", err)
		}
		return exporter, nil

	case "jaeger":
		// 直接使用 OTLP 导出到 Jaeger（推荐方式）
		// Jaeger 从 v1.35+ 支持 OTLP
		client := otlptracegrpc.NewClient(
			otlptracegrpc.WithEndpoint(cfg.TracingEndpoint),
			otlptracegrpc.WithInsecure(),
		)
		exporter, err := otlptrace.New(ctx, client)
		if err != nil {
			return nil, fmt.Errorf("创建 Jaeger Exporter 失败: %w", err)
		}
		return exporter, nil

	default:
		return nil, fmt.Errorf("不支持的 Tracing 类型: %s", cfg.TracingType)
	}
}

// StartSpan 开始一个 Span
//
// Example:
//
//	ctx, span := tracer.StartSpan(ctx, "CreateTask")
//	defer span.End()
//
//	span.SetAttributes(
//	    attribute.String("task.title", title),
//	    attribute.String("task.priority", priority),
//	)
func (t *Tracer) StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	if !t.enabled {
		return ctx, trace.SpanFromContext(ctx) // 返回 NoOp Span
	}

	return t.tracer.Start(ctx, name, opts...)
}

// StartHTTPSpan 开始一个 HTTP Span
//
// Example:
//
//	ctx, span := tracer.StartHTTPSpan(ctx, "GET /api/tasks")
//	defer span.End()
func (t *Tracer) StartHTTPSpan(ctx context.Context, method, path string) (context.Context, trace.Span) {
	spanName := fmt.Sprintf("%s %s", method, path)

	ctx, span := t.StartSpan(ctx, spanName,
		trace.WithSpanKind(trace.SpanKindServer),
	)

	span.SetAttributes(
		semconv.HTTPMethod(method),
		semconv.HTTPTarget(path),
	)

	return ctx, span
}

// RecordError 记录错误到 Span
//
// Example:
//
//	if err != nil {
//	    tracer.RecordError(span, err)
//	    span.SetStatus(codes.Error, err.Error())
//	}
func (t *Tracer) RecordError(span trace.Span, err error) {
	if !t.enabled || err == nil {
		return
	}

	span.RecordError(err)
}

// Shutdown 关闭 TracerProvider
//
// 应在应用退出前调用，确保所有 Span 都被导出
func (t *Tracer) Shutdown(ctx context.Context) error {
	if !t.enabled {
		return nil
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return t.provider.Shutdown(ctx)
}

// GetTracer 获取原生 trace.Tracer
func (t *Tracer) GetTracer() trace.Tracer {
	return t.tracer
}

// GetProvider 获取 TracerProvider
func (t *Tracer) GetProvider() *sdktrace.TracerProvider {
	return t.provider
}

// IsEnabled 检查 Tracing 是否启用
func (t *Tracer) IsEnabled() bool {
	return t.enabled
}

// --- 全局 Tracer 实例 ---

var globalTracer *Tracer

// InitGlobalTracer 初始化全局 Tracer
func InitGlobalTracer(ctx context.Context, cfg config.MonitoringConfig) error {
	tracer, err := NewTracer(ctx, cfg)
	if err != nil {
		return err
	}
	globalTracer = tracer
	return nil
}

// GetGlobalTracer 获取全局 Tracer
func GetGlobalTracer() *Tracer {
	return globalTracer
}

// ShutdownGlobalTracer 关闭全局 Tracer
func ShutdownGlobalTracer(ctx context.Context) error {
	if globalTracer != nil {
		return globalTracer.Shutdown(ctx)
	}
	return nil
}

// --- 便捷函数（使用全局 Tracer）---

// StartSpan 全局开始 Span
func StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
	if globalTracer != nil {
		return globalTracer.StartSpan(ctx, name, opts...)
	}
	return ctx, trace.SpanFromContext(ctx)
}

// StartHTTPSpan 全局开始 HTTP Span
func StartHTTPSpan(ctx context.Context, method, path string) (context.Context, trace.Span) {
	if globalTracer != nil {
		return globalTracer.StartHTTPSpan(ctx, method, path)
	}
	return ctx, trace.SpanFromContext(ctx)
}

// RecordError 全局记录错误
func RecordError(span trace.Span, err error) {
	if globalTracer != nil {
		globalTracer.RecordError(span, err)
	}
}

// --- Span 辅助函数 ---

// AddEvent 添加事件到 Span
//
// Example:
//
//	AddEvent(span, "TaskCreated", attribute.String("task_id", taskID))
func AddEvent(span trace.Span, name string, attrs ...attribute.KeyValue) {
	span.AddEvent(name, trace.WithAttributes(attrs...))
}

// SetAttributes 设置多个属性
//
// Example:
//
//	SetAttributes(span,
//	    attribute.String("user_id", userID),
//	    attribute.Int("task_count", count),
//	)
func SetAttributes(span trace.Span, attrs ...attribute.KeyValue) {
	span.SetAttributes(attrs...)
}

// --- 上下文传播辅助函数 ---

// InjectToHeaders 将 Trace 上下文注入到 HTTP Headers
//
// Example:
//
//	headers := make(http.Header)
//	InjectToHeaders(ctx, headers)
//	req.Header = headers
func InjectToHeaders(ctx context.Context, headers map[string][]string) {
	propagator := otel.GetTextMapPropagator()
	carrier := propagation.MapCarrier{}
	for k, vs := range headers {
		if len(vs) > 0 {
			carrier[k] = vs[0]
		}
	}
	propagator.Inject(ctx, carrier)

	// 将结果写回 headers
	for k, v := range carrier {
		headers[k] = []string{v}
	}
}

// ExtractFromHeaders 从 HTTP Headers 提取 Trace 上下文
//
// Example:
//
//	ctx := ExtractFromHeaders(ctx, c.Request.Header)
func ExtractFromHeaders(ctx context.Context, headers map[string][]string) context.Context {
	propagator := otel.GetTextMapPropagator()
	carrier := propagation.MapCarrier{}
	for k, vs := range headers {
		if len(vs) > 0 {
			carrier[k] = vs[0]
		}
	}
	return propagator.Extract(ctx, carrier)
}
