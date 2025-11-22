package logger

import (
	"context"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// ZapLogger Zap 日志实现
//
// 使用 Uber 的 Zap 库实现高性能日志
type ZapLogger struct {
	logger *zap.Logger
	sugar  *zap.SugaredLogger
	ctx    context.Context
}

// NewZapLogger 创建 Zap 日志器
//
// Example:
//
//	config := &logger.Config{
//	    Level:  logger.InfoLevel,
//	    Format: "json",
//	}
//	logger := logger.NewZapLogger(config)
func NewZapLogger(config *Config) (*ZapLogger, error) {
	if config == nil {
		config = DefaultConfig()
	}

	// 配置 Zap
	zapConfig := zap.NewProductionConfig()

	// 设置日志级别
	zapConfig.Level = zap.NewAtomicLevelAt(toZapLevel(config.Level))

	// 设置输出格式
	if config.Format == "console" {
		zapConfig.Encoding = "console"
		zapConfig.EncoderConfig = zap.NewDevelopmentEncoderConfig()
	} else {
		zapConfig.Encoding = "json"
		zapConfig.EncoderConfig = zap.NewProductionEncoderConfig()
	}

	// 设置时间格式
	zapConfig.EncoderConfig.TimeKey = "time"
	zapConfig.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	// 构建日志器
	zapLogger, err := zapConfig.Build(zap.AddCallerSkip(config.CallerSkip))
	if err != nil {
		return nil, err
	}

	return &ZapLogger{
		logger: zapLogger,
		sugar:  zapLogger.Sugar(),
	}, nil
}

// toZapLevel 转换日志级别
func toZapLevel(level Level) zapcore.Level {
	switch level {
	case DebugLevel:
		return zapcore.DebugLevel
	case InfoLevel:
		return zapcore.InfoLevel
	case WarnLevel:
		return zapcore.WarnLevel
	case ErrorLevel:
		return zapcore.ErrorLevel
	case FatalLevel:
		return zapcore.FatalLevel
	default:
		return zapcore.InfoLevel
	}
}

// Debug 调试日志
func (l *ZapLogger) Debug(msg string, fields ...interface{}) {
	l.logWithContext(l.sugar.Debugw, msg, fields...)
}

// Info 信息日志
func (l *ZapLogger) Info(msg string, fields ...interface{}) {
	l.logWithContext(l.sugar.Infow, msg, fields...)
}

// Warn 警告日志
func (l *ZapLogger) Warn(msg string, fields ...interface{}) {
	l.logWithContext(l.sugar.Warnw, msg, fields...)
}

// Error 错误日志
func (l *ZapLogger) Error(msg string, fields ...interface{}) {
	l.logWithContext(l.sugar.Errorw, msg, fields...)
}

// Fatal 致命错误日志
func (l *ZapLogger) Fatal(msg string, fields ...interface{}) {
	l.logWithContext(l.sugar.Fatalw, msg, fields...)
}

// logWithContext 带上下文的日志
func (l *ZapLogger) logWithContext(logFunc func(string, ...interface{}), msg string, fields ...interface{}) {
	if l.ctx != nil {
		// 添加上下文字段
		ctxFields := ExtractContextFields(l.ctx)
		for _, field := range ctxFields {
			fields = append(fields, field.Key, field.Value)
		}
	}

	logFunc(msg, fields...)
}

// With 添加上下文字段
func (l *ZapLogger) With(fields ...interface{}) Logger {
	return &ZapLogger{
		logger: l.logger,
		sugar:  l.sugar.With(fields...),
		ctx:    l.ctx,
	}
}

// WithContext 添加上下文
func (l *ZapLogger) WithContext(ctx context.Context) Logger {
	return &ZapLogger{
		logger: l.logger,
		sugar:  l.sugar,
		ctx:    ctx,
	}
}

// Sync 刷新缓冲区
func (l *ZapLogger) Sync() error {
	return l.logger.Sync()
}

