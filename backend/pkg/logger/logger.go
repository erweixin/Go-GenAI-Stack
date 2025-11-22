package logger

import (
	"context"
	"fmt"
	"io"
	"os"
)

// Logger 日志接口
//
// 提供统一的日志接口，可以切换不同的实现（Zap, Logrus 等）
type Logger interface {
	// Debug 调试级别日志
	Debug(msg string, fields ...interface{})

	// Info 信息级别日志
	Info(msg string, fields ...interface{})

	// Warn 警告级别日志
	Warn(msg string, fields ...interface{})

	// Error 错误级别日志
	Error(msg string, fields ...interface{})

	// Fatal 致命错误日志（会退出程序）
	Fatal(msg string, fields ...interface{})

	// With 添加上下文字段
	With(fields ...interface{}) Logger

	// WithContext 添加上下文
	WithContext(ctx context.Context) Logger
}

// Level 日志级别
type Level int

const (
	DebugLevel Level = iota
	InfoLevel
	WarnLevel
	ErrorLevel
	FatalLevel
)

// Config 日志配置
type Config struct {
	Level      Level       // 日志级别
	Format     string      // 格式：json 或 console
	Output     io.Writer   // 输出目标
	AddCaller  bool        // 是否添加调用者信息
	CallerSkip int         // 调用者跳过层数
}

// DefaultConfig 默认配置
func DefaultConfig() *Config {
	return &Config{
		Level:      InfoLevel,
		Format:     "console",
		Output:     os.Stdout,
		AddCaller:  true,
		CallerSkip: 1,
	}
}

// Field 日志字段
type Field struct {
	Key   string
	Value interface{}
}

// String 创建字符串字段
func String(key, value string) Field {
	return Field{Key: key, Value: value}
}

// Int 创建整数字段
func Int(key string, value int) Field {
	return Field{Key: key, Value: value}
}

// Int64 创建 int64 字段
func Int64(key string, value int64) Field {
	return Field{Key: key, Value: value}
}

// Float64 创建 float64 字段
func Float64(key string, value float64) Field {
	return Field{Key: key, Value: value}
}

// Bool 创建布尔字段
func Bool(key string, value bool) Field {
	return Field{Key: key, Value: value}
}

// Error 创建错误字段
func Error(err error) Field {
	return Field{Key: "error", Value: err}
}

// Any 创建任意类型字段
func Any(key string, value interface{}) Field {
	return Field{Key: key, Value: value}
}

// global logger
var globalLogger Logger

// SetGlobalLogger 设置全局日志器
func SetGlobalLogger(logger Logger) {
	globalLogger = logger
}

// GetGlobalLogger 获取全局日志器
func GetGlobalLogger() Logger {
	if globalLogger == nil {
		// 使用默认日志器
		globalLogger = NewStdLogger(DefaultConfig())
	}
	return globalLogger
}

// 便捷函数（使用全局日志器）

// Debug 调试日志
func Debug(msg string, fields ...interface{}) {
	GetGlobalLogger().Debug(msg, fields...)
}

// Info 信息日志
func Info(msg string, fields ...interface{}) {
	GetGlobalLogger().Info(msg, fields...)
}

// Warn 警告日志
func Warn(msg string, fields ...interface{}) {
	GetGlobalLogger().Warn(msg, fields...)
}

// Error 错误日志
func Error(msg string, fields ...interface{}) {
	GetGlobalLogger().Error(msg, fields...)
}

// Fatal 致命错误日志
func Fatal(msg string, fields ...interface{}) {
	GetGlobalLogger().Fatal(msg, fields...)
}

// With 添加上下文字段
func With(fields ...interface{}) Logger {
	return GetGlobalLogger().With(fields...)
}

// WithContext 添加上下文
func WithContext(ctx context.Context) Logger {
	return GetGlobalLogger().WithContext(ctx)
}

// ParseLevel 解析日志级别
func ParseLevel(level string) Level {
	switch level {
	case "debug":
		return DebugLevel
	case "info":
		return InfoLevel
	case "warn":
		return WarnLevel
	case "error":
		return ErrorLevel
	case "fatal":
		return FatalLevel
	default:
		return InfoLevel
	}
}

// LevelString 将日志级别转换为字符串
func (l Level) String() string {
	switch l {
	case DebugLevel:
		return "DEBUG"
	case InfoLevel:
		return "INFO"
	case WarnLevel:
		return "WARN"
	case ErrorLevel:
		return "ERROR"
	case FatalLevel:
		return "FATAL"
	default:
		return "UNKNOWN"
	}
}

// Enabled 检查日志级别是否启用
func (l Level) Enabled(target Level) bool {
	return l <= target
}

// contextKey 上下文键类型
type contextKey string

const (
	// RequestIDKey Request ID 键
	RequestIDKey contextKey = "request_id"
	// TraceIDKey Trace ID 键
	TraceIDKey contextKey = "trace_id"
	// UserIDKey User ID 键
	UserIDKey contextKey = "user_id"
)

// ExtractContextFields 从上下文中提取日志字段
func ExtractContextFields(ctx context.Context) []Field {
	var fields []Field

	if requestID, ok := ctx.Value(RequestIDKey).(string); ok && requestID != "" {
		fields = append(fields, String("request_id", requestID))
	}

	if traceID, ok := ctx.Value(TraceIDKey).(string); ok && traceID != "" {
		fields = append(fields, String("trace_id", traceID))
	}

	if userID, ok := ctx.Value(UserIDKey).(string); ok && userID != "" {
		fields = append(fields, String("user_id", userID))
	}

	return fields
}

// Example 使用示例
//
//	logger := logger.NewZapLogger(config)
//	logger.Info("server started", String("port", "8080"), Int("workers", 10))
//
//	// 带上下文
//	logger.WithContext(ctx).Info("processing request")
//
//	// 添加字段
//	logger.With(String("user_id", "123")).Info("user logged in")
func Example() {
	fmt.Println("See logger_test.go for usage examples")
}

