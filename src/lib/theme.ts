import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "notebook-theme";

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as Theme | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return { theme, toggle };
}

const DEFAULT_CATEGORY_KEY = "notebook-default-category";

export function getDefaultCategory(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEFAULT_CATEGORY_KEY);
}

export function setDefaultCategory(value: string | null) {
  if (value) localStorage.setItem(DEFAULT_CATEGORY_KEY, value);
  else localStorage.removeItem(DEFAULT_CATEGORY_KEY);
}
