import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  businessProfile: null,
  
  setUser: (user) => {
    set({ user })
  },

  setLoading: (loading) => {
    set({ loading })
  },

  setBusinessProfile: (profile) => {
    set({ businessProfile: profile })
  },

  clearUser: () => {
    set({ user: null, businessProfile: null })
  },
}))
