package logger

import (
	"fmt"
	"io"
	"os"

	"github.com/erweixin/go-genai-stack/infrastructure/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

// Logger 结构化日志器（基于 zap）
//
// 功能：
//   - 支持 JSON 和 Console 格式
//   - 支持多种输出（stdout, stderr, file）
//   - 支持日志轮转（Lumberjack）
//   - 支持日志级别（Debug, Info, Warn, Error）
//   - 支持上下文字段（TraceID, RequestID）
type Logger struct {
	zap    *zap.Logger
	sugar  *zap.SugaredLogger
	config config.LoggingConfig
}

// NewLogger 创建结构化日志器
//
// 当 config.Enabled = false 时，返回 nil（表示使用标准 log）
//
// Example:
//
//	logger := NewLogger(cfg.Logging)
//	if logger != nil {
//	    logger.Info("Server started", zap.Int("port", 8080))
//	}
func NewLogger(cfg config.LoggingConfig) (*Logger, error) {
	if !cfg.Enabled {
		return nil, nil // 不启用结构化日志
	}

	// 1. 解析日志级别
	level, err := parseLogLevel(cfg.Level)
	if err != nil {
		return nil, fmt.Errorf("无效的日志级别 %s: %w", cfg.Level, err)
	}

	// 2. 创建 Encoder
	encoder := createEncoder(cfg.Format)

	// 3. 创建 WriteSyncer
	writeSyncer, closeFn, err := createWriteSyncer(cfg)
	if err != nil {
		return nil, fmt.Errorf("创建日志输出失败: %w", err)
	}

	// 4. 创建 Core
	core := zapcore.NewCore(
		encoder,
		writeSyncer,
		level,
	)

	// 5. 创建 Logger（添加 Caller 和 Stacktrace）
	zapLogger := zap.New(core,
		zap.AddCaller(),
		zap.AddCallerSkip(1), // 跳过封装层
		zap.AddStacktrace(zapcore.ErrorLevel),
	)

	logger := &Logger{
		zap:    zapLogger,
		sugar:  zapLogger.Sugar(),
		config: cfg,
	}

	// 注册清理函数
	if closeFn != nil {
		// 可以在应用退出时调用 Sync
	}

	return logger, nil
}

// parseLogLevel 解析日志级别
func parseLogLevel(levelStr string) (zapcore.Level, error) {
	switch levelStr {
	case "debug":
		return zapcore.DebugLevel, nil
	case "info":
		return zapcore.InfoLevel, nil
	case "warn":
		return zapcore.WarnLevel, nil
	case "error":
		return zapcore.ErrorLevel, nil
	default:
		return zapcore.InfoLevel, fmt.Errorf("不支持的日志级别: %s", levelStr)
	}
}

// createEncoder 创建日志编码器
func createEncoder(format string) zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder   // 时间格式
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder // 级别大写
	encoderConfig.EncodeCaller = zapcore.ShortCallerEncoder // 短文件名

	switch format {
	case "json":
		return zapcore.NewJSONEncoder(encoderConfig)
	case "console":
		encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder // 彩色输出
		return zapcore.NewConsoleEncoder(encoderConfig)
	default:
		return zapcore.NewJSONEncoder(encoderConfig)
	}
}

// createWriteSyncer 创建日志输出器
func createWriteSyncer(cfg config.LoggingConfig) (zapcore.WriteSyncer, func(), error) {
	switch cfg.Output {
	case "stdout":
		return zapcore.AddSync(os.Stdout), nil, nil

	case "stderr":
		return zapcore.AddSync(os.Stderr), nil, nil

	case "file":
		// 使用 Lumberjack 实现日志轮转
		lumberjackLogger := &lumberjack.Logger{
			Filename:   cfg.OutputPath,
			MaxSize:    cfg.MaxSize,    // MB
			MaxBackups: cfg.MaxBackups, // 保留文件数
			MaxAge:     cfg.MaxAge,     // 天数
			Compress:   cfg.Compress,   // 是否压缩
		}

		closeFn := func() {
			_ = lumberjackLogger.Close()
		}

		return zapcore.AddSync(lumberjackLogger), closeFn, nil

	default:
		return zapcore.AddSync(os.Stdout), nil, nil
	}
}

// --- Zap Logger 方法 ---

// Debug 输出 Debug 级别日志
func (l *Logger) Debug(msg string, fields ...zap.Field) {
	l.zap.Debug(msg, fields...)
}

// Info 输出 Info 级别日志
func (l *Logger) Info(msg string, fields ...zap.Field) {
	l.zap.Info(msg, fields...)
}

// Warn 输出 Warn 级别日志
func (l *Logger) Warn(msg string, fields ...zap.Field) {
	l.zap.Warn(msg, fields...)
}

// Error 输出 Error 级别日志
func (l *Logger) Error(msg string, fields ...zap.Field) {
	l.zap.Error(msg, fields...)
}

// Fatal 输出 Fatal 级别日志（会退出程序）
func (l *Logger) Fatal(msg string, fields ...zap.Field) {
	l.zap.Fatal(msg, fields...)
}

// With 添加上下文字段（返回新的 Logger）
func (l *Logger) With(fields ...zap.Field) *Logger {
	return &Logger{
		zap:    l.zap.With(fields...),
		sugar:  l.sugar.With(convertFieldsToInterface(fields)...),
		config: l.config,
	}
}

// convertFieldsToInterface 将 zap.Field 转换为 interface{}
func convertFieldsToInterface(fields []zap.Field) []interface{} {
	result := make([]interface{}, len(fields))
	for i, f := range fields {
		result[i] = f
	}
	return result
}

// --- Sugar Logger 方法 ---

// Debugf 格式化输出 Debug 日志
func (l *Logger) Debugf(template string, args ...interface{}) {
	l.sugar.Debugf(template, args...)
}

// Infof 格式化输出 Info 日志
func (l *Logger) Infof(template string, args ...interface{}) {
	l.sugar.Infof(template, args...)
}

// Warnf 格式化输出 Warn 日志
func (l *Logger) Warnf(template string, args ...interface{}) {
	l.sugar.Warnf(template, args...)
}

// Errorf 格式化输出 Error 日志
func (l *Logger) Errorf(template string, args ...interface{}) {
	l.sugar.Errorf(template, args...)
}

// Fatalf 格式化输出 Fatal 日志（会退出程序）
func (l *Logger) Fatalf(template string, args ...interface{}) {
	l.sugar.Fatalf(template, args...)
}

// Sync 刷新缓冲区（应用退出前调用）
func (l *Logger) Sync() error {
	return l.zap.Sync()
}

// GetZap 获取原生 zap.Logger（用于高级用法）
func (l *Logger) GetZap() *zap.Logger {
	return l.zap
}

// GetSugar 获取 SugaredLogger（用于格式化日志）
func (l *Logger) GetSugar() *zap.SugaredLogger {
	return l.sugar
}

// --- 全局 Logger 实例 ---

var globalLogger *Logger

// InitGlobalLogger 初始化全局 Logger
func InitGlobalLogger(cfg config.LoggingConfig) error {
	logger, err := NewLogger(cfg)
	if err != nil {
		return err
	}
	globalLogger = logger
	return nil
}

// GetGlobalLogger 获取全局 Logger
func GetGlobalLogger() *Logger {
	return globalLogger
}

// --- 便捷函数（使用全局 Logger）---

// Debug 全局 Debug 日志
func Debug(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Debug(msg, fields...)
	}
}

// Info 全局 Info 日志
func Info(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Info(msg, fields...)
	}
}

// Warn 全局 Warn 日志
func Warn(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Warn(msg, fields...)
	}
}

// Error 全局 Error 日志
func Error(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Error(msg, fields...)
	}
}

// Sync 刷新全局 Logger
func Sync() error {
	if globalLogger != nil {
		return globalLogger.Sync()
	}
	return nil
}

// --- 多输出支持 ---

// NewMultiOutputLogger 创建多输出日志器
//
// Example:
//
//	logger := NewMultiOutputLogger(cfg, os.Stdout, fileWriter)
func NewMultiOutputLogger(cfg config.LoggingConfig, outputs ...io.Writer) (*Logger, error) {
	if !cfg.Enabled {
		return nil, nil
	}

	// 解析日志级别
	level, err := parseLogLevel(cfg.Level)
	if err != nil {
		return nil, err
	}

	// 创建 Encoder
	encoder := createEncoder(cfg.Format)

	// 合并多个输出
	writers := make([]zapcore.WriteSyncer, 0, len(outputs))
	for _, output := range outputs {
		writers = append(writers, zapcore.AddSync(output))
	}
	multiWriter := zapcore.NewMultiWriteSyncer(writers...)

	// 创建 Core
	core := zapcore.NewCore(encoder, multiWriter, level)

	// 创建 Logger
	zapLogger := zap.New(core,
		zap.AddCaller(),
		zap.AddCallerSkip(1),
		zap.AddStacktrace(zapcore.ErrorLevel),
	)

	return &Logger{
		zap:    zapLogger,
		sugar:  zapLogger.Sugar(),
		config: cfg,
	}, nil
}
