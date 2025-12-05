/**
 * 本地存储工具函数
 * 提供统一的存储接口，抽象 Web localStorage 和 RN AsyncStorage
 */

/**
 * 存储适配器接口
 * Web 使用 localStorage，Mobile 使用 AsyncStorage
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null> | string | null
  setItem(key: string, value: string): Promise<void> | void
  removeItem(key: string): Promise<void> | void
  clear(): Promise<void> | void
}

/**
 * 存储键常量
 */
export const STORAGE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_ID: 'user_id',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_CONVERSATIONS: 'recent_conversations',
  SETTINGS: 'settings',
} as const

/**
 * 类型安全的存储工具类
 */
export class TypedStorage {
  constructor(private adapter: StorageAdapter) {}

  /**
   * 获取字符串值
   */
  async getString(key: string): Promise<string | null> {
    return await this.adapter.getItem(key)
  }

  /**
   * 设置字符串值
   */
  async setString(key: string, value: string): Promise<void> {
    await this.adapter.setItem(key, value)
  }

  /**
   * 获取 JSON 对象
   */
  async getObject<T>(key: string): Promise<T | null> {
    const json = await this.adapter.getItem(key)
    if (!json) return null
    try {
      return JSON.parse(json) as T
    } catch {
      return null
    }
  }

  /**
   * 设置 JSON 对象
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    await this.adapter.setItem(key, JSON.stringify(value))
  }

  /**
   * 删除键
   */
  async remove(key: string): Promise<void> {
    await this.adapter.removeItem(key)
  }

  /**
   * 清空所有
   */
  async clear(): Promise<void> {
    await this.adapter.clear()
  }
}

/**
 * Web localStorage 适配器
 */
export class WebStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    return localStorage.getItem(key)
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value)
  }

  removeItem(key: string): void {
    localStorage.removeItem(key)
  }

  clear(): void {
    localStorage.clear()
  }
}

/**
 * 示例：Mobile AsyncStorage 适配器
 * 实际使用时需要导入 @react-native-async-storage/async-storage
 */
export class MobileStorageAdapter implements StorageAdapter {
  constructor(private AsyncStorage: any) {}

  async getItem(key: string): Promise<string | null> {
    return await this.AsyncStorage.getItem(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.AsyncStorage.setItem(key, value)
  }

  async removeItem(key: string): Promise<void> {
    await this.AsyncStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    await this.AsyncStorage.clear()
  }
}

/**
 * 创建存储实例的工厂函数
 *
 * @example
 * // Web
 * const storage = createStorage(new WebStorageAdapter());
 *
 * // Mobile
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 * const storage = createStorage(new MobileStorageAdapter(AsyncStorage));
 */
export function createStorage(adapter: StorageAdapter): TypedStorage {
  return new TypedStorage(adapter)
}
