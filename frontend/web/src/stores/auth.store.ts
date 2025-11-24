import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService, LoginRequest, RegisterRequest } from '@/services/auth.service'
import { userService, UserProfile } from '@/services/user.service'

interface AuthState {
  // 状态
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
  error: string | null

  // Actions
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isAuthenticated: !!localStorage.getItem('access_token'),
      user: null,
      isLoading: false,
      error: null,

      // 登录
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login(data)
          
          // 保存 Token
          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('refresh_token', response.refresh_token)
          localStorage.setItem('user_id', response.user_id)

          // 更新状态
          set({ isAuthenticated: true })

          // 获取用户信息
          await get().fetchUser()
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '登录失败'
          set({ error: errorMessage, isLoading: false })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // 注册
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.register(data)
          
          // 保存 Token
          localStorage.setItem('access_token', response.access_token)
          localStorage.setItem('refresh_token', response.refresh_token)
          localStorage.setItem('user_id', response.user_id)

          // 更新状态
          set({ isAuthenticated: true })

          // 获取用户信息
          await get().fetchUser()
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '注册失败'
          set({ error: errorMessage, isLoading: false })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // 登出
      logout: () => {
        authService.logout()
        set({
          isAuthenticated: false,
          user: null,
          error: null,
        })
      },

      // 获取用户信息
      fetchUser: async () => {
        if (!get().isAuthenticated) return

        set({ isLoading: true, error: null })
        try {
          const user = await userService.getProfile()
          set({ user, isLoading: false })
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '获取用户信息失败'
          set({ error: errorMessage, isLoading: false })
          
          // 如果是 401 错误，清除认证状态
          if (error.response?.status === 401) {
            get().logout()
          }
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

