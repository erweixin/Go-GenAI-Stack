import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserProfile } from '../../hooks/useUserProfile'
import { userApi } from '../../api/user.api'
import { useUserStore } from '../../stores/user.store'
import { useAuthStore } from '@/features/auth/stores/auth.store'

// Mock APIs
vi.mock('../../api/user.api')
vi.mock('@/features/auth/stores/auth.store')

describe('useUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUserStore.getState().reset()
  })

  it('应该在已认证时自动加载用户资料', async () => {
    // Arrange
    const mockProfile = {
      user_id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      status: 'active' as const,
      email_verified: true,
      created_at: '2025-11-27T10:00:00Z',
      updated_at: '2025-11-27T10:00:00Z'
    }

    vi.mocked(userApi.getProfile).mockResolvedValue(mockProfile)
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      // ... other auth store properties
    } as any)

    // Act
    const { result } = renderHook(() => useUserProfile())

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.error).toBeNull()
    expect(userApi.getProfile).toHaveBeenCalledTimes(1)
  })

  it('未认证时不应该加载用户资料', () => {
    // Arrange
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
    } as any)

    // Act
    renderHook(() => useUserProfile())

    // Assert
    expect(userApi.getProfile).not.toHaveBeenCalled()
  })

  it('加载失败时应该设置错误', async () => {
    // Arrange
    const errorMessage = 'Failed to load profile'
    vi.mocked(userApi.getProfile).mockRejectedValue(new Error(errorMessage))
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as any)

    // Act
    const { result } = renderHook(() => useUserProfile())

    // Assert
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.profile).toBeNull()
  })

  it('应该能够手动刷新用户资料', async () => {
    // Arrange
    const mockProfile = {
      user_id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      full_name: 'Test User',
      status: 'active' as const,
      email_verified: true,
      created_at: '2025-11-27T10:00:00Z',
      updated_at: '2025-11-27T10:00:00Z'
    }

    vi.mocked(userApi.getProfile).mockResolvedValue(mockProfile)
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as any)

    // Act
    const { result } = renderHook(() => useUserProfile())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // 清除 mock 调用记录
    vi.clearAllMocks()

    // 手动刷新
    await result.current.refresh()

    // Assert
    await waitFor(() => {
      expect(userApi.getProfile).toHaveBeenCalledTimes(1)
    })
  })
})

