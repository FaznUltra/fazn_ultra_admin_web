import { create } from 'zustand';
import type { User } from '../lib/schemas';
import { clearTokens, saveTokens } from '../lib/tokens';
import { AuthResponse } from '../lib/schemas';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (data: AuthResponse) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),

  login: (data) => {
    saveTokens(data.accessToken, data.refreshToken);
    set({ user: data.user, isLoading: false });
  },

  logout: () => {
    clearTokens();
    set({ user: null, isLoading: false });
  },
}));
