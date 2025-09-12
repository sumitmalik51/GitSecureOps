/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand colors - Indigo + Neon Green
        brand: {
          primary: '#6366f1', // Indigo
          secondary: '#10b981', // Neon Green
          accent: '#06ffa5', // Bright Neon
        },
        // Dark mode focused color system
        dark: {
          bg: '#0a0a0b',
          surface: '#1a1a1b',
          card: '#262627',
          border: '#404040',
          text: '#e4e4e7',
          'text-muted': '#a1a1aa',
        },
        // Light mode colors
        light: {
          bg: '#ffffff',
          surface: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          text: '#1e293b',
          'text-muted': '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 6s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { 'box-shadow': '0 0 20px rgba(16, 185, 129, 0.5)' },
          '100%': { 'box-shadow': '0 0 40px rgba(16, 185, 129, 0.8)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
