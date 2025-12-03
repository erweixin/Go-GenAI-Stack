import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth.api'
import { setUser as setSentryUser, clearUser as clearSentryUser } from '@/lib/monitoring/sentry'
import type { LoginRequest, RegisterRequest } from '@go-genai-stack/types'

interface UserProfile {
  user_id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
}

interface AuthState {
  // 状态
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  accessToken: string | null
  refreshToken: string | null

  // Actions
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  setUser: (user: UserProfile) => void
  clearError: () => void
}

/**
 * Auth Store
 *
 * 认证状态管理（Zustand + LocalStorage）
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态
      isAuthenticated: !!localStorage.getItem('access_token'),
      user: null,
      isLoading: false,
      error: null,
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),

      // 登录
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(data)

          // 保存 Token
          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('refresh_token', response.refresh_token)
          localStorage.setItem('user_id', response.user_id)

          // 更新状态
          set({
            isAuthenticated: true,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user: {
              user_id: response.user_id,
              email: response.email,
            },
            isLoading: false,
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '登录失败'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      // 注册
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(data)

          // 保存 Token
          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('refresh_token', response.refresh_token)
          localStorage.setItem('user_id', response.user_id)

          // 更新状态
          const user = {
            user_id: response.user_id,
            email: response.email,
          }

          set({
            isAuthenticated: true,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user,
            isLoading: false,
          })

          // 设置 Sentry 用户上下文
          setSentryUser({
            id: user.user_id,
            email: user.email,
          })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '注册失败'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      // 登出
      logout: () => {
        try {
          authApi.logout()
        } catch (error) {
          console.error('Logout error:', error)
        }

        // 清除 Token
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_id')

        // 清除 Sentry 用户上下文
        clearSentryUser()

        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        })
      },

      // 设置用户信息
      setUser: (user: UserProfile) => set({ user }),

      // 清除错误
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
