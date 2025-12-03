import { create } from 'zustand'

interface UserProfile {
  user_id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  status?: string
  email_verified?: boolean
  created_at?: string
  updated_at?: string
  last_login_at?: string
}

interface UserState {
  // 状态
  profile: UserProfile | null
  loading: boolean
  error: string | null

  // Actions
  setProfile: (profile: UserProfile) => void
  updateProfile: (profile: Partial<UserProfile>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  profile: null,
  loading: false,
  error: null,
}

/**
 * User Store
 *
 * 用户状态管理
 */
export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  setProfile: (profile) => set({ profile }),

  updateProfile: (updatedProfile) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updatedProfile } : null,
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
