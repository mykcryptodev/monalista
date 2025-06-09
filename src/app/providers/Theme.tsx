"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { FarcasterContext } from "../context/Farcaster";
import { getFid } from "thirdweb/extensions/farcaster";
import { useActiveAccount } from "thirdweb/react";
import { client } from "~/constants";

export type ThemeContextValue = {
  theme: string;
  setTheme: (theme: string) => void;
};

const DEFAULT_THEME = "black";

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const farcaster = useContext(FarcasterContext);
  const [fid, setFid] = useState<number | null>(null);
  const [theme, setThemeState] = useState<string>(DEFAULT_THEME);

  // check the address
  useEffect(() => {
    console.log("account", account);
    if (account) {
      getFid({ address: account.address, client }).then((fid) => {
        console.log("fid", fid);
        console.log("account.address", account.address);
        setFid(Number(fid));
      });
    }
  }, [account]);

  // check the farcaster context
  useEffect(() => {
    if (farcaster?.context?.user?.fid) {
      setFid(farcaster.context.user.fid);
    }
  }, [farcaster]);

  // Load the stored theme for this user when their FID is available
  useEffect(() => {
    console.log("fid", fid);
    if (!fid) return;
    (async () => {
      try {
        const res = await fetch(`/api/theme?fid=${fid}`);
        console.log("res", res);
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
