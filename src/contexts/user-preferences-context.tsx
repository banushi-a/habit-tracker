"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface UserPreferences {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const UserPreferencesContext = createContext<UserPreferences | undefined>(
  undefined,
);

const THEME_STORAGE_KEY = "user-theme-preference";

/**
 * Provider component for user preferences including theme settings.
 *
 * Manages theme state and persists preferences to localStorage and cookies.
 * Automatically applies theme changes to the document root element.
 *
 * @param props - Component props
 * @param props.children - Child components that will have access to the context
 */
export function UserPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  // Apply theme to document and save to storage
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Save to cookie for SSR
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value: UserPreferences = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

/**
 * Hook to access user preferences context.
 *
 * Must be used within a UserPreferencesProvider.
 *
 * @returns User preferences including theme and setter functions
 * @throws Error if used outside of UserPreferencesProvider
 */
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider",
    );
  }
  return context;
}
