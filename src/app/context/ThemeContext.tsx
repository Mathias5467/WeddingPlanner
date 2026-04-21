"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'orange' | 'blue' | 'emerald' | 'rose' | 'violet' | 'amber' | 'cyan' | 'gold';
type Mode = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('orange');
  const [mode, setModeState] = useState<Mode>('dark');

  useEffect(() => {
    const sT = localStorage.getItem('w-theme') as Theme;
    const sM = localStorage.getItem('w-mode') as Mode;
    if (sT) setThemeState(sT);
    if (sM) setModeState(sM);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('w-theme', t);
  };

  const setMode = (m: Mode) => {
    setModeState(m);
    localStorage.setItem('w-mode', m);
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.body.setAttribute('data-mode', mode);
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme error');
  return context;
};