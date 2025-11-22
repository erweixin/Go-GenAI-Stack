/**
 * 消息项组件
 * 展示如何使用 shared/types 和 shared/utils
 */

import type { SendMessageResponse } from '@go-genai-stack/types';
import { formatRelativeTime, formatTokenCount } from '@go-genai-stack/utils';

interface MessageItemProps {
  message: SendMessageResponse;
  timestamp: string; // ISO 8601 格式
}

export function MessageItem({ message, timestamp }: MessageItemProps) {
  return (
    <div className="message-item">
      <div className="message-content">{message.content}</div>
      
      <div className="message-footer">
        <span className="timestamp">
          {formatRelativeTime(timestamp)}
        </span>
        
        <span className="tokens">
          {formatTokenCount(message.tokens)} tokens
        </span>
      </div>
    </div>
  );
}

/**
 * 使用示例：
 * 
 * import { MessageItem } from './MessageItem';
 * import type { SendMessageResponse } from '@go-genai-stack/types';
 * 
 * const response: SendMessageResponse = {
 *   message_id: 'msg-123',
 *   content: 'Hello world',
 *   tokens: 1500,
 * };
 * 
 * <MessageItem message={response} timestamp={new Date().toISOString()} />
 */

