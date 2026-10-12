export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "csp_dashboard_theme";

/**
 * Retrieves the preferred theme safely.
 * Wrapped in try/catch to gracefully handle restricted browser storage environments.
 */
export function getInitialTheme(): Theme {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Storage access may fail (e.g. strict private browsing or disabled storage)
  }

  // Fallback to system preference if accessible
  if (typeof window !== "undefined" && window.matchMedia) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  return "dark";
}

/**
 * Persists and applies the selected theme to the root HTML element.
 */
export function applyTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Silently continue if storage write is denied
  }

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}
