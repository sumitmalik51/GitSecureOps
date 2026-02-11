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
        // Obsidian design system
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          primary: '#6366f1',
          secondary: '#10b981',
          accent: '#06ffa5',
        },
        success: {
          50: '#ecfdf5', 100: '#d1fae5', 400: '#34d399', 500: '#10b981', 600: '#059669',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        },
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 400: '#f87171', 500: '#ef4444', 600: '#dc2626',
        },
        // Dark palette — zinc-based for a premium feel
        dark: {
          bg:       '#09090b',
          surface:  '#18181b',
          card:     '#1f1f23',
          hover:    '#27272a',
          border:   '#2e2e33',
          'border-light': '#3f3f46',
          text:     '#fafafa',
          'text-secondary': '#a1a1aa',
          'text-muted': '#71717a',
        },
        // Light mode
        light: {
          bg: '#ffffff',
          surface: '#f4f4f5',
          card: '#ffffff',
          border: '#e4e4e7',
          text: '#18181b',
          'text-muted': '#71717a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'glow-sm': '0 0 12px -3px rgba(99, 102, 241, 0.25)',
        'glow':    '0 0 20px -5px rgba(99, 102, 241, 0.35)',
        'glow-lg': '0 0 40px -8px rgba(99, 102, 241, 0.4)',
        'glow-success': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'elevated': '0 8px 30px rgba(0, 0, 0, 0.35)',
        'elevated-lg': '0 16px 50px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-out',
        'slide-up':    'slideUp 0.5s ease-out',
        'slide-down':  'slideDown 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient':    'gradient 6s ease infinite',
        'float':       'float 6s ease-in-out infinite',
        'glow':        'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradient: {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%':      { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%':   { boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
