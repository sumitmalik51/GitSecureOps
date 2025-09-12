import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitHubUser } from '../services/oauthService';
import githubService from '../services/githubService';

interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: GitHubUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication on app load
    const storedToken = localStorage.getItem('github_token');
    const storedUser = localStorage.getItem('github_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as GitHubUser;
        setToken(storedToken);
        setUser(parsedUser);
        githubService.setToken(storedToken);
      } catch (error) {
        console.error('Failed to restore user session:', error);
        // Clear corrupted data
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: GitHubUser) => {
    setToken(newToken);
    setUser(newUser);
    githubService.setToken(newToken);
    
    // Store in localStorage for persistence
    localStorage.setItem('github_token', newToken);
    localStorage.setItem('github_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('github_token');
    localStorage.removeItem('github_user');
    localStorage.removeItem('oauth_state');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
