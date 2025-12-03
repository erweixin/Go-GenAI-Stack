import { useAuthStore } from '../stores/auth.store'
import type { RegisterRequest } from '@go-genai-stack/types'

/**
 * 注册 Hook
 *
 * 用例：Register
 */
export function useRegister() {
  const { register, isLoading, error, clearError } = useAuthStore()

  const handleRegister = async (data: RegisterRequest) => {
    clearError()
    await register(data)
  }

  return {
    register: handleRegister,
    loading: isLoading,
    error,
  }
}
