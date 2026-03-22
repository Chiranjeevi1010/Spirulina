import { create } from 'zustand';
import i18n from 'i18next';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  language: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  language: localStorage.getItem('spirulina_language') || 'en',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebarCollapse: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setLanguage: (lang) => {
    localStorage.setItem('spirulina_language', lang);
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
