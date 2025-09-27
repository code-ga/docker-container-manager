import React, { createContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


interface DarkThemeProviderProps {
  children: React.ReactNode;
}

export const DarkThemeProvider: React.FC<DarkThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first, then default to dark mode
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#111827'); // gray-900
      root.style.setProperty('--bg-secondary', '#1f2937'); // gray-800
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#d1d5db'); // gray-300
      root.style.setProperty('--neon-blue', '#00f5ff');
      root.style.setProperty('--neon-purple', '#ff00ff');
      root.style.setProperty('--accent-blue', '#3b82f6');
      root.style.setProperty('--accent-purple', '#8b5cf6');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb'); // gray-50
      root.style.setProperty('--text-primary', '#111827'); // gray-900
      root.style.setProperty('--text-secondary', '#6b7280'); // gray-500
      root.style.setProperty('--neon-blue', '#0ea5e9');
      root.style.setProperty('--neon-purple', '#a855f7');
      root.style.setProperty('--accent-blue', '#2563eb');
      root.style.setProperty('--accent-purple', '#7c3aed');
    }

    // Save to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const value = {
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};