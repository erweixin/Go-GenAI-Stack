package metrics

import (
	"fmt"
	"runtime"
	"time"

	"net/http"

	"github.com/erweixin/go-genai-stack/backend/infrastructure/config"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics Prometheus 指标收集器
//
// 功能：
//   - HTTP 请求指标（QPS、延迟、错误率）
//   - 系统指标（Goroutine、内存、CPU）
//   - 自定义业务指标
type Metrics struct {
	registry *prometheus.Registry
	enabled  bool

	// HTTP 指标
	requestCounter  *prometheus.CounterVec   // 请求总数
	requestDuration *prometheus.HistogramVec // 请求延迟
	requestInFlight prometheus.Gauge         // 正在处理的请求数
	responseSizeVec *prometheus.HistogramVec // 响应大小

	// 系统指标
	goroutines prometheus.Gauge // Goroutine 数量
	memAlloc   prometheus.Gauge // 内存分配
	memSys     prometheus.Gauge // 系统内存
}

// NewMetrics 创建 Metrics 实例
//
// 当 config.MetricsEnabled = false 时，返回 nil（禁用 Metrics）
//
// Example:
//
//	metrics := NewMetrics(cfg.Monitoring)
//	if metrics != nil {
//	    metrics.RecordRequest("GET", "/api/tasks", 200, 0.5)
//	}
func NewMetrics(cfg config.MonitoringConfig) *Metrics {
	if !cfg.MetricsEnabled {
		return nil // 禁用 Metrics
	}

	// 创建独立的 Registry（不使用全局 Registry）
	registry := prometheus.NewRegistry()

	// 注册 Go Runtime 收集器
	registry.MustRegister(collectors.NewGoCollector())
	registry.MustRegister(collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))

	// 创建 HTTP 指标
	requestCounter := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	requestDuration := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency in seconds",
			Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10}, // 5ms ~ 10s
		},
		[]string{"method", "path"},
	)

	requestInFlight := prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_requests_in_flight",
			Help: "Current number of HTTP requests being served",
		},
	)

	responseSizeVec := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 8), // 100B ~ 10MB
		},
		[]string{"method", "path"},
	)

	// 创建系统指标
	goroutines := prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "go_goroutines_count",
			Help: "Number of goroutines that currently exist",
		},
	)

	memAlloc := prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "go_memory_alloc_bytes",
			Help: "Number of bytes allocated and still in use",
		},
	)

	memSys := prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "go_memory_sys_bytes",
			Help: "Number of bytes obtained from system",
		},
	)

	// 注册所有指标
	registry.MustRegister(
		requestCounter,
		requestDuration,
		requestInFlight,
		responseSizeVec,
		goroutines,
		memAlloc,
		memSys,
	)

	metrics := &Metrics{
		registry:        registry,
		enabled:         true,
		requestCounter:  requestCounter,
		requestDuration: requestDuration,
		requestInFlight: requestInFlight,
		responseSizeVec: responseSizeVec,
		goroutines:      goroutines,
		memAlloc:        memAlloc,
		memSys:          memSys,
	}

	// 启动系统指标采集
	go metrics.collectSystemMetrics()

	return metrics
}

// collectSystemMetrics 定期采集系统指标
func (m *Metrics) collectSystemMetrics() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		var memStats runtime.MemStats
		runtime.ReadMemStats(&memStats)

		m.goroutines.Set(float64(runtime.NumGoroutine()))
		m.memAlloc.Set(float64(memStats.Alloc))
		m.memSys.Set(float64(memStats.Sys))
	}
}

// RecordRequest 记录 HTTP 请求指标
//
// Example:
//
//	metrics.RecordRequest("GET", "/api/tasks", 200, 0.5)
func (m *Metrics) RecordRequest(method, path string, statusCode int, durationSeconds float64) {
	if !m.enabled {
		return
	}

	// 记录请求总数
	m.requestCounter.WithLabelValues(method, path, fmt.Sprintf("%d", statusCode)).Inc()

	// 记录请求延迟
	m.requestDuration.WithLabelValues(method, path).Observe(durationSeconds)
}

// RecordResponseSize 记录响应大小
func (m *Metrics) RecordResponseSize(method, path string, sizeBytes int) {
	if !m.enabled {
		return
	}

	m.responseSizeVec.WithLabelValues(method, path).Observe(float64(sizeBytes))
}

// IncInFlight 增加正在处理的请求数
func (m *Metrics) IncInFlight() {
	if !m.enabled {
		return
	}

	m.requestInFlight.Inc()
}

// DecInFlight 减少正在处理的请求数
func (m *Metrics) DecInFlight() {
	if !m.enabled {
		return
	}

	m.requestInFlight.Dec()
}

// GetRegistry 获取 Prometheus Registry
func (m *Metrics) GetRegistry() *prometheus.Registry {
	return m.registry
}

// GetHandler 获取 Prometheus HTTP Handler
//
// Example:
//
//	h.GET("/metrics", adaptor.NewHertzHTTPHandler(metrics.GetHandler()))
func (m *Metrics) GetHandler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
	})
}

// --- 自定义指标支持 ---

// Counter 创建自定义 Counter
//
// Example:
//
//	taskCreated := metrics.NewCounter("task_created_total", "Total tasks created")
//	taskCreated.Inc()
func (m *Metrics) NewCounter(name, help string) prometheus.Counter {
	counter := prometheus.NewCounter(prometheus.CounterOpts{
		Name: name,
		Help: help,
	})
	m.registry.MustRegister(counter)
	return counter
}

// CounterVec 创建自定义 CounterVec
//
// Example:
//
//	taskCounter := metrics.NewCounterVec("task_created_total", "Total tasks", []string{"priority"})
//	taskCounter.WithLabelValues("high").Inc()
func (m *Metrics) NewCounterVec(name, help string, labels []string) *prometheus.CounterVec {
	counter := prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: name,
			Help: help,
		},
		labels,
	)
	m.registry.MustRegister(counter)
	return counter
}

// Gauge 创建自定义 Gauge
//
// Example:
//
//	activeUsers := metrics.NewGauge("active_users", "Current active users")
//	activeUsers.Set(100)
func (m *Metrics) NewGauge(name, help string) prometheus.Gauge {
	gauge := prometheus.NewGauge(prometheus.GaugeOpts{
		Name: name,
		Help: help,
	})
	m.registry.MustRegister(gauge)
	return gauge
}

// GaugeVec 创建自定义 GaugeVec
func (m *Metrics) NewGaugeVec(name, help string, labels []string) *prometheus.GaugeVec {
	gauge := prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: name,
			Help: help,
		},
		labels,
	)
	m.registry.MustRegister(gauge)
	return gauge
}

// Histogram 创建自定义 Histogram
//
// Example:
//
//	dbQueryDuration := metrics.NewHistogram("db_query_duration_seconds", "DB query duration")
//	dbQueryDuration.Observe(0.05)
func (m *Metrics) NewHistogram(name, help string, buckets []float64) prometheus.Histogram {
	if buckets == nil {
		buckets = prometheus.DefBuckets
	}

	histogram := prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    name,
		Help:    help,
		Buckets: buckets,
	})
	m.registry.MustRegister(histogram)
	return histogram
}

// HistogramVec 创建自定义 HistogramVec
func (m *Metrics) NewHistogramVec(name, help string, labels []string, buckets []float64) *prometheus.HistogramVec {
	if buckets == nil {
		buckets = prometheus.DefBuckets
	}

	histogram := prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    name,
			Help:    help,
			Buckets: buckets,
		},
		labels,
	)
	m.registry.MustRegister(histogram)
	return histogram
}

// --- 全局 Metrics 实例 ---

var globalMetrics *Metrics

// InitGlobalMetrics 初始化全局 Metrics
func InitGlobalMetrics(cfg config.MonitoringConfig) {
	globalMetrics = NewMetrics(cfg)
}

// GetGlobalMetrics 获取全局 Metrics
func GetGlobalMetrics() *Metrics {
	return globalMetrics
}

// RecordRequest 全局记录请求
func RecordRequest(method, path string, statusCode int, durationSeconds float64) {
	if globalMetrics != nil {
		globalMetrics.RecordRequest(method, path, statusCode, durationSeconds)
	}
}

// IncInFlight 全局增加请求计数
func IncInFlight() {
	if globalMetrics != nil {
		globalMetrics.IncInFlight()
	}
}

// DecInFlight 全局减少请求计数
func DecInFlight() {
	if globalMetrics != nil {
		globalMetrics.DecInFlight()
	}
}
