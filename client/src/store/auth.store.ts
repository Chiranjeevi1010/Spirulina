import { create } from 'zustand';
import type { User, Role } from '@spirulina/shared';

interface AuthState {
  user: (User & { role: Role }) | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User & { role: Role }, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem('accessToken');
    if (token && !get().isAuthenticated) {
      set({ accessToken: token, isAuthenticated: true });
      return true;
    }
    return get().isAuthenticated;
  },
}));
