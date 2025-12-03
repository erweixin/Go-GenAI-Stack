import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLogin } from '../../hooks/useLogin'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import type { LoginRequest } from '@go-genai-stack/types'

// Mock API
vi.mock('../../api/auth.api')

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 清除 localStorage
    localStorage.clear()
    // 重置 store
    const store = useAuthStore.getState()
    store.isAuthenticated = false
    store.user = null
    store.accessToken = null
    store.refreshToken = null
    store.error = null
  })

  it('应该成功登录', async () => {
    // Arrange
    const mockRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    }

    const mockResponse = {
      user_id: 'user-1',
      email: 'test@example.com',
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
    }

    vi.mocked(authApi.login).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useLogin())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()

    await result.current.login(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(authApi.login).toHaveBeenCalledWith(mockRequest)
    expect(authApi.login).toHaveBeenCalledTimes(1)

    // 验证 tokens 已保存到 localStorage
    expect(localStorage.getItem('access_token')).toBe('mock-access-token')
    expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
    expect(localStorage.getItem('user_id')).toBe('user-1')

    // 验证 store 状态已更新
    const store = useAuthStore.getState()
    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.user_id).toBe('user-1')
    expect(store.user?.email).toBe('test@example.com')
  })

  it('登录失败时应该设置错误', async () => {
    // Arrange
    const mockRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'wrong-password',
    }

    const errorMessage = 'Invalid credentials'
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { message: errorMessage } },
    })

    // Act
    const { result } = renderHook(() => useLogin())

    try {
      await result.current.login(mockRequest)
    } catch (error) {
      // 预期会抛出错误
    }

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
    })

    // 验证未保存任何 tokens
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()

    // 验证 store 状态未变化
    const store = useAuthStore.getState()
    expect(store.isAuthenticated).toBe(false)
  })

  it('应该在登录前清除之前的错误', async () => {
    // Arrange
    const store = useAuthStore.getState()
    store.error = 'Previous error'

    const mockRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    }

    vi.mocked(authApi.login).mockResolvedValue({
      user_id: 'user-1',
      email: 'test@example.com',
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
    })

    // Act
    const { result } = renderHook(() => useLogin())

    await result.current.login(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
  })

  it('登录过程中 loading 状态应该正确', async () => {
    // Arrange
    const mockRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123',
    }

    // 模拟延迟响应
    vi.mocked(authApi.login).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                user_id: 'user-1',
                email: 'test@example.com',
                access_token: 'token',
                refresh_token: 'refresh',
                expires_in: 3600,
              }),
            100
          )
        )
    )

    // Act
    const { result } = renderHook(() => useLogin())

    expect(result.current.loading).toBe(false)

    const promise = result.current.login(mockRequest)

    // 登录过程中应该是 loading
    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    await promise

    // 完成后 loading 应该是 false
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
