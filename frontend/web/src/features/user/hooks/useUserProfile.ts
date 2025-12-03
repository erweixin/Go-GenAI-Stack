import { useEffect } from 'react'
import { useUserStore } from '../stores/user.store'
import { userApi } from '../api/user.api'
import { useAuthStore } from '@/features/auth/stores/auth.store'

/**
 * 用户资料 Hook
 *
 * 用例：GetUserProfile
 *
 * 自动加载当前登录用户的资料
 */
export function useUserProfile() {
  const { profile, loading, error, setProfile, setLoading, setError } = useUserStore()
  const { isAuthenticated } = useAuthStore()

  const loadProfile = async () => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)
      const response = await userApi.getProfile()
      setProfile(response)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile'
      setError(message)
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && !profile) {
      loadProfile()
    }
  }, [isAuthenticated])

  return {
    profile,
    loading,
    error,
    refresh: loadProfile,
  }
}
