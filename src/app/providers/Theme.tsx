"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { FarcasterContext } from "../context/Farcaster";

export type ThemeContextValue = {
  theme: string;
  setTheme: (theme: string) => void;
};

const DEFAULT_THEME = "black";

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const farcaster = useContext(FarcasterContext);
  const fid = farcaster?.context?.user?.fid;
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);

  // Load the stored theme for this user when their FID is available
  useEffect(() => {
    if (!fid) return;
    (async () => {
      try {
        const res = await fetch(`/api/theme?fid=${fid}`);
        if (res.ok) {
          const data = await res.json();
          setThemeState(data.theme);
        }
      } catch {
        // ignore network errors
      }
    })();
  }, [fid]);

  // Sync the html data-theme attribute whenever the theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    if (fid) {
      try {
        await fetch("/api/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid, theme: newTheme }),
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
