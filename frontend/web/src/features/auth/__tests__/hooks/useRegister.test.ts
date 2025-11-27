import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRegister } from '../../hooks/useRegister'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import type { RegisterRequest } from '@go-genai-stack/types'

// Mock API
vi.mock('../../api/auth.api')

describe('useRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    const store = useAuthStore.getState()
    store.isAuthenticated = false
    store.user = null
    store.accessToken = null
    store.refreshToken = null
    store.error = null
  })

  it('应该成功注册', async () => {
    // Arrange
    const mockRequest: RegisterRequest = {
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
      full_name: 'New User'
    }

    const mockResponse = {
      user_id: 'user-2',
      email: 'newuser@example.com',
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600
    }

    vi.mocked(authApi.register).mockResolvedValue(mockResponse)

    // Act
    const { result } = renderHook(() => useRegister())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()

    await result.current.register(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(authApi.register).toHaveBeenCalledWith(mockRequest)
    expect(authApi.register).toHaveBeenCalledTimes(1)

    // 验证 tokens 已保存
    expect(localStorage.getItem('access_token')).toBe('mock-access-token')
    expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token')
    expect(localStorage.getItem('user_id')).toBe('user-2')

    // 验证 store 状态
    const store = useAuthStore.getState()
    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.user_id).toBe('user-2')
    expect(store.user?.email).toBe('newuser@example.com')
  })

  it('注册失败时应该设置错误', async () => {
    // Arrange
    const mockRequest: RegisterRequest = {
      email: 'existing@example.com',
      password: 'password123'
    }

    const errorMessage = 'Email already exists'
    vi.mocked(authApi.register).mockRejectedValue({
      response: { data: { message: errorMessage } }
    })

    // Act
    const { result } = renderHook(() => useRegister())

    try {
      await result.current.register(mockRequest)
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

    // 验证 store 状态未变化
    const store = useAuthStore.getState()
    expect(store.isAuthenticated).toBe(false)
  })

  it('应该在注册前清除之前的错误', async () => {
    // Arrange
    const store = useAuthStore.getState()
    store.error = 'Previous error'

    const mockRequest: RegisterRequest = {
      email: 'test@example.com',
      password: 'password123'
    }

    vi.mocked(authApi.register).mockResolvedValue({
      user_id: 'user-1',
      email: 'test@example.com',
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600
    })

    // Act
    const { result } = renderHook(() => useRegister())

    await result.current.register(mockRequest)

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
  })
})

