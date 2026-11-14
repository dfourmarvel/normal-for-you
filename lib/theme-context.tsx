"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { storedSetting, useStoredSetting } from "./stored-setting";

export type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeSetting = storedSetting<Theme>("biotensor-theme", "light", (v): v is Theme => v === "dark" || v === "light");

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStoredSetting(themeSetting);

  useEffect(() => {
    applyTheme(themeSetting.get());
  }, []);

  const setTheme = useCallback((t: Theme) => {
    themeSetting.set(t);
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
