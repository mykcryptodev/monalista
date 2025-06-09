"use client";

import { useContext } from "react";
import Link from "next/link";
import { ThemeContext } from "../providers/Theme";

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];

export default function ThemePage() {
  const themeCtx = useContext(ThemeContext);
  if (!themeCtx) return null;
  const { theme, setTheme } = themeCtx;

  return (
    <main className="bg-base-400 min-h-screen w-screen pb-20">
      <div className="w-[300px] mx-auto p-4 bg-base-300 rounded-lg min-h-full overflow-y-auto space-y-4">
        <div className="mb-2">
          <Link href="/" className="btn btn-sm btn-ghost">
            ← Back
          </Link>
        </div>
        <h1 className="font-bold">Select Theme</h1>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`btn btn-sm capitalize ${theme === t ? "btn-primary" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
