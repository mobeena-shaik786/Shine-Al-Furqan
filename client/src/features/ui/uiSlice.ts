import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ThemeMode = 'light' | 'dark';

interface UiState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  theme: ThemeMode;
  searchOpen: boolean;
  unreadNotifications: number;
}

const storedCollapsed = localStorage.getItem('saf_sidebar_collapsed') === 'true';
const storedTheme = (localStorage.getItem('saf_theme') as ThemeMode | null) ?? 'light';

const initialState: UiState = {
  sidebarCollapsed: storedCollapsed,
  sidebarMobileOpen: false,
  theme: storedTheme,
  searchOpen: false,
  unreadNotifications: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem('saf_sidebar_collapsed', String(state.sidebarCollapsed));
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
      localStorage.setItem('saf_sidebar_collapsed', String(action.payload));
    },
    setSidebarMobileOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarMobileOpen = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('saf_theme', state.theme);
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      localStorage.setItem('saf_theme', action.payload);
      document.documentElement.classList.toggle('dark', action.payload === 'dark');
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    setUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.unreadNotifications = Math.max(0, action.payload);
    },
  },
});

export const {
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setSidebarMobileOpen,
  toggleTheme,
  setTheme,
  setSearchOpen,
  setUnreadNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
