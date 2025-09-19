import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Check for stored theme preference or default to dark (current design)
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // Apply theme to document root for Tailwind dark mode
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light'); 
      root.classList.remove('dark');
    }
    
    // Store theme preference
    localStorage.setItem('theme', theme);
    
    // Update CSS custom properties for the current theme
    updateThemeProperties(theme);
  }, [theme]);

  const updateThemeProperties = (currentTheme: Theme) => {
    const root = document.documentElement;
    
    if (currentTheme === 'light') {
      // Light theme variables
      root.style.setProperty('--color-bg', '#ffffff');
      root.style.setProperty('--color-surface', '#f8fafc');
      root.style.setProperty('--color-card', '#ffffff');
      root.style.setProperty('--color-border', '#e2e8f0');
      root.style.setProperty('--color-text', '#1e293b');
      root.style.setProperty('--color-text-muted', '#64748b');
      root.style.setProperty('--color-primary', '#3b82f6');
      root.style.setProperty('--color-secondary', '#10b981');
      root.style.setProperty('--color-accent', '#8b5cf6');
    } else {
      // Dark theme variables (current design)
      root.style.setProperty('--color-bg', '#0a0e1a');
      root.style.setProperty('--color-surface', '#1a1f35');
      root.style.setProperty('--color-card', '#1a1f35');
      root.style.setProperty('--color-border', '#2d3748');
      root.style.setProperty('--color-text', '#f1f5f9');
      root.style.setProperty('--color-text-muted', '#94a3b8');
      root.style.setProperty('--color-primary', '#3b82f6');
      root.style.setProperty('--color-secondary', '#10b981');
      root.style.setProperty('--color-accent', '#8b5cf6');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    console.log(`Toggling theme from ${theme} to ${newTheme}`);
    setThemeState(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
