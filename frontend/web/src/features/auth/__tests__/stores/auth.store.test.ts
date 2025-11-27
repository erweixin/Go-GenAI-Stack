import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../../stores/auth.store'
import { authApi } from '../../api/auth.api'

// Mock API
vi.mock('../../api/auth.api')

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    const store = useAuthStore.getState()
    store.isAuthenticated = false
    store.user = null
    store.accessToken = null
    store.refreshToken = null
    store.error = null
    store.isLoading = false
  })

  describe('login', () => {
    it('应该成功登录并更新状态', async () => {
      // Arrange
      const mockResponse = {
        user_id: 'user-1',
        email: 'test@example.com',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600
      }

      vi.mocked(authApi.login).mockResolvedValue(mockResponse)

      // Act
      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123'
      })

      // Assert
      const store = useAuthStore.getState()
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.user_id).toBe('user-1')
      expect(store.user?.email).toBe('test@example.com')
      expect(store.accessToken).toBe('access-token')
      expect(store.refreshToken).toBe('refresh-token')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()

      // 验证 localStorage
      expect(localStorage.getItem('access_token')).toBe('access-token')
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token')
      expect(localStorage.getItem('user_id')).toBe('user-1')
    })

    it('登录失败时应该设置错误', async () => {
      // Arrange
      const errorMessage = 'Invalid credentials'
      vi.mocked(authApi.login).mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      // Act
      try {
        await useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'wrong'
        })
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const store = useAuthStore.getState()
      expect(store.error).toBe(errorMessage)
      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('应该成功注册并更新状态', async () => {
      // Arrange
      const mockResponse = {
        user_id: 'user-2',
        email: 'newuser@example.com',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600
      }

      vi.mocked(authApi.register).mockResolvedValue(mockResponse)

      // Act
      await useAuthStore.getState().register({
        email: 'newuser@example.com',
        password: 'password123'
      })

      // Assert
      const store = useAuthStore.getState()
      expect(store.isAuthenticated).toBe(true)
      expect(store.user?.user_id).toBe('user-2')
      expect(store.user?.email).toBe('newuser@example.com')
      expect(store.accessToken).toBe('access-token')
      expect(store.refreshToken).toBe('refresh-token')
    })

    it('注册失败时应该设置错误', async () => {
      // Arrange
      const errorMessage = 'Email already exists'
      vi.mocked(authApi.register).mockRejectedValue({
        response: { data: { message: errorMessage } }
      })

      // Act
      try {
        await useAuthStore.getState().register({
          email: 'existing@example.com',
          password: 'password123'
        })
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const store = useAuthStore.getState()
      expect(store.error).toBe(errorMessage)
      expect(store.isLoading).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('应该清除认证状态', async () => {
      // Arrange - 先登录
      vi.mocked(authApi.login).mockResolvedValue({
        user_id: 'user-1',
        email: 'test@example.com',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600
      })

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Mock logout API
      vi.mocked(authApi.logout).mockResolvedValue(undefined)

      // Act
      useAuthStore.getState().logout()

      // Assert
      const store = useAuthStore.getState()
      expect(store.isAuthenticated).toBe(false)
      expect(store.user).toBeNull()
      expect(store.accessToken).toBeNull()
      expect(store.refreshToken).toBeNull()
      expect(store.error).toBeNull()

      // 验证 localStorage 已清除
      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
      expect(localStorage.getItem('user_id')).toBeNull()
    })
  })

  describe('setUser', () => {
    it('应该能够设置用户信息', () => {
      // Arrange
      const mockUser = {
        user_id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User'
      }

      // Act
      useAuthStore.getState().setUser(mockUser)

      // Assert
      const store = useAuthStore.getState()
      expect(store.user).toEqual(mockUser)
    })
  })

  describe('clearError', () => {
    it('应该能够清除错误', () => {
      // Arrange
      const store = useAuthStore.getState()
      store.error = 'Some error'

      // Act
      store.clearError()

      // Assert
      expect(useAuthStore.getState().error).toBeNull()
    })
  })
})

