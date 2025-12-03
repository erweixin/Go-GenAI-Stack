import { useAuthStore } from '../stores/auth.store'
import type { LoginRequest } from '@go-genai-stack/types'

/**
 * 登录 Hook
 *
 * 用例：Login
 */
export function useLogin() {
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleLogin = async (data: LoginRequest) => {
    clearError()
    await login(data)
  }

  return {
    login: handleLogin,
    loading: isLoading,
    error,
  }
}
