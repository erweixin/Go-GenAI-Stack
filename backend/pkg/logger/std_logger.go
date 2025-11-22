package logger

import (
	"context"
	"fmt"
	"log"
	"os"
	"runtime"
	"time"
)

// StdLogger 标准库日志实现
//
// 使用 Go 标准库的 log 包实现，适合简单场景
type StdLogger struct {
	config *Config
	fields []Field
	ctx    context.Context
}

// NewStdLogger 创建标准库日志器
//
// Example:
//
//	config := &logger.Config{
//	    Level:  logger.InfoLevel,
//	    Format: "console",
//	    Output: os.Stdout,
//	}
//	logger := logger.NewStdLogger(config)
func NewStdLogger(config *Config) *StdLogger {
	if config == nil {
		config = DefaultConfig()
	}

	return &StdLogger{
		config: config,
		fields: make([]Field, 0),
	}
}

// log 输出日志
func (l *StdLogger) log(level Level, msg string, fields ...interface{}) {
	// 检查日志级别
	if !l.config.Level.Enabled(level) {
		return
	}

	// 构建日志消息
	timestamp := time.Now().Format("2006-01-02 15:04:05.000")
	levelStr := level.String()

	// 添加调用者信息
	caller := ""
	if l.config.AddCaller {
		_, file, line, ok := runtime.Caller(l.config.CallerSkip + 1)
		if ok {
			caller = fmt.Sprintf(" %s:%d", file, line)
		}
	}

	// 构建字段
	fieldStr := l.formatFields(fields...)

	// 输出日志
	logMsg := fmt.Sprintf("[%s] %s%s %s%s", timestamp, levelStr, caller, msg, fieldStr)
	log.New(l.config.Output, "", 0).Println(logMsg)

	// Fatal 级别退出程序
	if level == FatalLevel {
		os.Exit(1)
	}
}

// formatFields 格式化字段
func (l *StdLogger) formatFields(fields ...interface{}) string {
	if len(fields) == 0 && len(l.fields) == 0 {
		return ""
	}

	result := " |"

	// 添加持久字段
	for _, field := range l.fields {
		result += fmt.Sprintf(" %s=%v", field.Key, field.Value)
	}

	// 添加临时字段
	for i := 0; i < len(fields); i += 2 {
		if i+1 < len(fields) {
			key := fmt.Sprintf("%v", fields[i])
			value := fields[i+1]
			result += fmt.Sprintf(" %s=%v", key, value)
		}
	}

	// 添加上下文字段
	if l.ctx != nil {
		ctxFields := ExtractContextFields(l.ctx)
		for _, field := range ctxFields {
			result += fmt.Sprintf(" %s=%v", field.Key, field.Value)
		}
	}

	return result
}

// Debug 调试日志
func (l *StdLogger) Debug(msg string, fields ...interface{}) {
	l.log(DebugLevel, msg, fields...)
}

// Info 信息日志
func (l *StdLogger) Info(msg string, fields ...interface{}) {
	l.log(InfoLevel, msg, fields...)
}

// Warn 警告日志
func (l *StdLogger) Warn(msg string, fields ...interface{}) {
	l.log(WarnLevel, msg, fields...)
}

// Error 错误日志
func (l *StdLogger) Error(msg string, fields ...interface{}) {
	l.log(ErrorLevel, msg, fields...)
}

// Fatal 致命错误日志
func (l *StdLogger) Fatal(msg string, fields ...interface{}) {
	l.log(FatalLevel, msg, fields...)
}

// With 添加上下文字段
func (l *StdLogger) With(fields ...interface{}) Logger {
	newLogger := &StdLogger{
		config: l.config,
		fields: make([]Field, len(l.fields)),
		ctx:    l.ctx,
	}
	copy(newLogger.fields, l.fields)

	// 添加新字段
	for i := 0; i < len(fields); i += 2 {
		if i+1 < len(fields) {
			key := fmt.Sprintf("%v", fields[i])
			value := fields[i+1]
			newLogger.fields = append(newLogger.fields, Field{Key: key, Value: value})
		}
	}

	return newLogger
}

// WithContext 添加上下文
func (l *StdLogger) WithContext(ctx context.Context) Logger {
	newLogger := &StdLogger{
		config: l.config,
		fields: l.fields,
		ctx:    ctx,
	}
	return newLogger
}

