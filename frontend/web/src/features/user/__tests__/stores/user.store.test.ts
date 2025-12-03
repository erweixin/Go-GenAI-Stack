import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from '../../stores/user.store'

describe('UserStore', () => {
  beforeEach(() => {
    useUserStore.getState().reset()
  })

  describe('setProfile', () => {
    it('应该能够设置用户资料', () => {
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
        updated_at: '2025-11-27T10:00:00Z',
      }

      // Act
      useUserStore.getState().setProfile(mockProfile)

      // Assert
      const store = useUserStore.getState()
      expect(store.profile).toEqual(mockProfile)
    })
  })

  describe('updateProfile', () => {
    it('应该能够更新部分用户资料', () => {
      // Arrange
      const initialProfile = {
        user_id: 'user-1',
        email: 'test@example.com',
        username: 'oldusername',
        full_name: 'Old Name',
        status: 'active' as const,
        email_verified: true,
        created_at: '2025-11-27T10:00:00Z',
        updated_at: '2025-11-27T10:00:00Z',
      }

      useUserStore.getState().setProfile(initialProfile)

      // Act
      useUserStore.getState().updateProfile({
        username: 'newusername',
        full_name: 'New Name',
      })

      // Assert
      const store = useUserStore.getState()
      expect(store.profile?.username).toBe('newusername')
      expect(store.profile?.full_name).toBe('New Name')
      expect(store.profile?.email).toBe('test@example.com') // 未修改的字段保持不变
    })

    it('profile 为 null 时更新不应该报错', () => {
      // Act & Assert
      expect(() => {
        useUserStore.getState().updateProfile({
          username: 'newusername',
        })
      }).not.toThrow()

      const store = useUserStore.getState()
      expect(store.profile).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('应该能够设置 loading 状态', () => {
      // Act
      useUserStore.getState().setLoading(true)

      // Assert
      expect(useUserStore.getState().loading).toBe(true)

      // Act
      useUserStore.getState().setLoading(false)

      // Assert
      expect(useUserStore.getState().loading).toBe(false)
    })
  })

  describe('setError', () => {
    it('应该能够设置错误信息', () => {
      // Arrange
      const errorMessage = 'Something went wrong'

      // Act
      useUserStore.getState().setError(errorMessage)

      // Assert
      expect(useUserStore.getState().error).toBe(errorMessage)
    })

    it('应该能够清空错误信息', () => {
      // Arrange
      useUserStore.getState().setError('Error')

      // Act
      useUserStore.getState().setError(null)

      // Assert
      expect(useUserStore.getState().error).toBeNull()
    })
  })

  describe('reset', () => {
    it('应该能够重置所有状态', () => {
      // Arrange
      const store = useUserStore.getState()

      // 修改所有状态
      store.setProfile({
        user_id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        full_name: 'Test User',
        status: 'active' as const,
        email_verified: true,
        created_at: '2025-11-27T10:00:00Z',
        updated_at: '2025-11-27T10:00:00Z',
      })
      store.setLoading(true)
      store.setError('Error')

      // Act
      store.reset()

      // Assert
      expect(store.profile).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
