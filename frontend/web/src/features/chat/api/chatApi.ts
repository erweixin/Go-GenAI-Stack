/**
 * 聊天 API 客户端
 * 使用 @go-genai-stack/types 的类型定义
 */

import type { SendMessageRequest, SendMessageResponse } from '@go-genai-stack/types';
import { API_ENDPOINTS } from '@go-genai-stack/constants';

/**
 * 发送消息
 */
export async function sendMessage(
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await fetch(API_ENDPOINTS.chat.send, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 流式发送消息
 */
export async function* streamMessage(
  request: SendMessageRequest
): AsyncGenerator<string> {
  const response = await fetch(API_ENDPOINTS.chat.stream, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to stream message: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No reader available');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(Boolean);

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          yield data;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

