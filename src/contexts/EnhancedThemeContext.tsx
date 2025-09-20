import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Theme types and interfaces
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  danger: string
  info: string
  background: {
    primary: string
    secondary: string
    tertiary: string
  }
  text: {
    primary: string
    secondary: string
    muted: string
    inverse: string
  }
  border: string
  shadow: string
}

export interface OrganizationBranding {
  name: string
  logo?: string
  favicon?: string
  colors: Partial<ThemeColors>
  font?: {
    family: string
    weights: number[]
  }
}

export interface ThemeConfig {
  id: string
  name: string
  colors: ThemeColors
  mode: 'light' | 'dark'
}

// Default themes
const defaultDarkTheme: ThemeConfig = {
  id: 'dark',
  name: 'Dark Theme',
  mode: 'dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#e2e8f0',
      muted: '#94a3b8',
      inverse: '#1e293b'
    },
    border: '#374151',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
  }
}

const defaultLightTheme: ThemeConfig = {
  id: 'light',
  name: 'Light Theme',
  mode: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#e2e8f0'
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      muted: '#64748b',
      inverse: '#f8fafc'
    },
    border: '#e2e8f0',
    shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
}

// GitHub-inspired themes
const githubDarkTheme: ThemeConfig = {
  id: 'github-dark',
  name: 'GitHub Dark',
  mode: 'dark',
  colors: {
    primary: '#238636',
    secondary: '#8b5cf6',
    accent: '#58a6ff',
    success: '#238636',
    warning: '#d29922',
    danger: '#f85149',
    info: '#58a6ff',
    background: {
      primary: '#0d1117',
      secondary: '#161b22',
      tertiary: '#21262d'
    },
    text: {
      primary: '#c9d1d9',
      secondary: '#8b949e',
      muted: '#6e7681',
      inverse: '#0d1117'
    },
    border: '#30363d',
    shadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
  }
}

interface ThemeContextType {
  currentTheme: ThemeConfig
  availableThemes: ThemeConfig[]
  setTheme: (themeId: string) => void
  organizationBranding?: OrganizationBranding
  setOrganizationBranding: (branding: OrganizationBranding) => void
  applyCustomColors: (colors: Partial<ThemeColors>) => void
  resetTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'dark' 
}) => {
  const availableThemes = [defaultDarkTheme, defaultLightTheme, githubDarkTheme]
  
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(
    availableThemes.find(theme => theme.id === defaultTheme) || defaultDarkTheme
  )
  
  const [organizationBranding, setOrgBranding] = useState<OrganizationBranding | undefined>()

  // Load saved theme and branding from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('gso-theme')
    const savedBranding = localStorage.getItem('gso-org-branding')
    
    if (savedTheme) {
      const theme = availableThemes.find(t => t.id === savedTheme)
      if (theme) {
        setCurrentTheme(theme)
      }
    }
    
    if (savedBranding) {
      try {
        setOrgBranding(JSON.parse(savedBranding))
      } catch (error) {
        console.error('Failed to parse saved organization branding:', error)
      }
    }
  }, [])

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement
    const colors = currentTheme.colors
    
    // Apply theme colors to CSS variables
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-success', colors.success)
    root.style.setProperty('--color-warning', colors.warning)
    root.style.setProperty('--color-danger', colors.danger)
    root.style.setProperty('--color-info', colors.info)
    
    root.style.setProperty('--bg-primary', colors.background.primary)
    root.style.setProperty('--bg-secondary', colors.background.secondary)
    root.style.setProperty('--bg-tertiary', colors.background.tertiary)
    
    root.style.setProperty('--text-primary', colors.text.primary)
    root.style.setProperty('--text-secondary', colors.text.secondary)
    root.style.setProperty('--text-muted', colors.text.muted)
    root.style.setProperty('--text-inverse', colors.text.inverse)
    
    root.style.setProperty('--border-color', colors.border)
    root.style.setProperty('--shadow', colors.shadow)
    
    // Apply organization branding if available
    if (organizationBranding?.colors) {
      Object.entries(organizationBranding.colors).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          root.style.setProperty(`--color-${key}`, value)
        }
      })
    }
    
    if (organizationBranding?.font) {
      root.style.setProperty('--font-family', organizationBranding.font.family)
    }
  }, [currentTheme, organizationBranding])

  const setTheme = (themeId: string) => {
    const theme = availableThemes.find(t => t.id === themeId)
    if (theme) {
      setCurrentTheme(theme)
      localStorage.setItem('gso-theme', themeId)
    }
  }

  const setOrganizationBranding = (branding: OrganizationBranding) => {
    setOrgBranding(branding)
    localStorage.setItem('gso-org-branding', JSON.stringify(branding))
  }

  const applyCustomColors = (colors: Partial<ThemeColors>) => {
    const customTheme: ThemeConfig = {
      ...currentTheme,
      id: 'custom',
      name: 'Custom Theme',
      colors: {
        ...currentTheme.colors,
        ...colors
      }
    }
    setCurrentTheme(customTheme)
  }

  const resetTheme = () => {
    setCurrentTheme(defaultDarkTheme)
    setOrgBranding(undefined)
    localStorage.removeItem('gso-theme')
    localStorage.removeItem('gso-org-branding')
  }

  const value: ThemeContextType = {
    currentTheme,
    availableThemes,
    setTheme,
    organizationBranding,
    setOrganizationBranding,
    applyCustomColors,
    resetTheme
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Helper function to generate theme-aware CSS classes
export const getThemeClasses = (theme: ThemeConfig) => ({
  // Background classes
  bgPrimary: `bg-[${theme.colors.background.primary}]`,
  bgSecondary: `bg-[${theme.colors.background.secondary}]`,
  bgTertiary: `bg-[${theme.colors.background.tertiary}]`,
  
  // Text classes
  textPrimary: `text-[${theme.colors.text.primary}]`,
  textSecondary: `text-[${theme.colors.text.secondary}]`,
  textMuted: `text-[${theme.colors.text.muted}]`,
  
  // Border classes
  border: `border-[${theme.colors.border}]`,
  
  // Button classes
  btnPrimary: `bg-[${theme.colors.primary}] text-[${theme.colors.text.inverse}] hover:opacity-90`,
  btnSecondary: `bg-[${theme.colors.secondary}] text-[${theme.colors.text.inverse}] hover:opacity-90`,
})

export default ThemeProvider
