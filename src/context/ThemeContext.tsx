import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'ink-wash' | 'warm-espresso' | 'royal-blue';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'ink-wash',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('labshare_color_theme');
      if (saved === 'ink-wash' || saved === 'warm-espresso' || saved === 'royal-blue') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'ink-wash'; // Default to Ink wash screenshot
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('labshare_color_theme', newTheme);
    } catch {
      // ignore
    }
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
