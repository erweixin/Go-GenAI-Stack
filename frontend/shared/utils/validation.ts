/**
 * 验证工具函数
 * 跨 Web 和 Mobile 平台使用
 */

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 * 
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证消息长度
 * @param message 消息内容
 * @param maxLength 最大长度，默认 10000
 * @returns 验证结果
 * 
 * @example
 * validateMessageLength('Hello') // { valid: true }
 * validateMessageLength('', 10) // { valid: false, error: 'MESSAGE_EMPTY' }
 */
export function validateMessageLength(
  message: string,
  maxLength: number = 10000
): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'MESSAGE_EMPTY' };
  }
  
  if (message.length > maxLength) {
    return { valid: false, error: 'MESSAGE_TOO_LONG' };
  }
  
  return { valid: true };
}

/**
 * 验证 URL 格式
 * @param url URL 字符串
 * @returns 是否有效
 * 
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('not-a-url') // false
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证对话 ID 格式
 * @param conversationId 对话 ID
 * @returns 是否有效
 * 
 * @example
 * isValidConversationId('conv-123abc') // true
 * isValidConversationId('invalid') // false
 */
export function isValidConversationId(conversationId: string): boolean {
  // 假设格式为: conv-{uuid} 或 conv-{alphanumeric}
  const idRegex = /^conv-[a-zA-Z0-9-]+$/;
  return idRegex.test(conversationId);
}

/**
 * 清理用户输入（防止 XSS）
 * @param input 用户输入
 * @returns 清理后的字符串
 * 
 * @example
 * sanitizeInput('<script>alert("xss")</script>') // '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 验证文件扩展名
 * @param filename 文件名
 * @param allowedExtensions 允许的扩展名数组
 * @returns 是否有效
 * 
 * @example
 * isValidFileExtension('document.pdf', ['.pdf', '.doc']) // true
 * isValidFileExtension('script.exe', ['.pdf', '.doc']) // false
 */
export function isValidFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.some(allowed => allowed.toLowerCase() === ext);
}

