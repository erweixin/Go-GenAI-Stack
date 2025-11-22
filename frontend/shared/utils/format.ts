/**
 * 格式化工具函数
 * 跨 Web 和 Mobile 平台使用
 */

/**
 * 格式化相对时间
 * @param date 日期对象或 ISO 字符串
 * @returns 相对时间字符串（如 "刚刚"、"5分钟前"）
 * 
 * @example
 * formatRelativeTime(new Date()) // "刚刚"
 * formatRelativeTime(new Date(Date.now() - 1000 * 60 * 5)) // "5分钟前"
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  // 超过 7 天显示具体日期
  return targetDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化 Token 数量
 * @param tokens Token 数量
 * @returns 格式化的字符串（如 "1.2K"、"1.5M"）
 * 
 * @example
 * formatTokenCount(500) // "500"
 * formatTokenCount(1500) // "1.5K"
 * formatTokenCount(1500000) // "1.5M"
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的字符串（如 "1.2 KB"、"3.5 MB"）
 * 
 * @example
 * formatFileSize(500) // "500 B"
 * formatFileSize(1024) // "1.0 KB"
 * formatFileSize(1048576) // "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * 格式化金额（美元）
 * @param amount 金额
 * @param decimals 小数位数，默认 2
 * @returns 格式化的字符串（如 "$1.50"）
 * 
 * @example
 * formatCurrency(1.5) // "$1.50"
 * formatCurrency(0.001, 4) // "$0.0010"
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `$${amount.toFixed(decimals)}`;
}

/**
 * 格式化百分比
 * @param value 数值（0-1 之间）
 * @param decimals 小数位数，默认 1
 * @returns 格式化的字符串（如 "85.5%"）
 * 
 * @example
 * formatPercentage(0.855) // "85.5%"
 * formatPercentage(0.9999, 2) // "99.99%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 格式化延迟时间
 * @param ms 毫秒数
 * @returns 格式化的字符串（如 "150ms"、"1.5s"）
 * 
 * @example
 * formatLatency(150) // "150ms"
 * formatLatency(1500) // "1.5s"
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

