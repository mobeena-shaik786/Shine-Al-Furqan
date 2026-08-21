/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '380px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        warm: 'rgb(var(--color-warm) / <alpha-value>)',
        bubblegum: 'rgb(var(--color-bubblegum) / <alpha-value>)',
        surface: {
          page: 'rgb(var(--color-page-bg) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
          card: 'rgb(var(--color-card-bg) / <alpha-value>)',
          sidebar: 'rgb(var(--color-sidebar-bg) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        line: 'rgb(var(--color-border) / <alpha-value>)',
        danger: 'rgb(var(--color-error) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Tahoma', 'sans-serif'],
        arabic: ['Noto Naskh Arabic', 'Amiri', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(30, 37, 49, 0.04), 0 4px 12px rgba(30, 37, 49, 0.05)',
        lift: '0 8px 24px rgba(176, 24, 40, 0.12)',
      },
      borderRadius: {
        card: '14px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-48px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(48px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'gold-shine': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.7s ease-out',
        'slide-in-right': 'slide-in-right 0.7s ease-out',
        'float-y': 'float-y 4.5s ease-in-out infinite',
        'gold-shine': 'gold-shine 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
