"use client";

import { useContext } from "react";
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

export function ThemePicker() {
  const themeCtx = useContext(ThemeContext);
  if (!themeCtx) return null;
  const { theme, setTheme } = themeCtx;
  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-xs capitalize">
        {theme}
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box max-h-60 overflow-y-auto w-32 text-xs"
      >
        {themes.map((t) => (
          <li key={t}>
            <button onClick={() => setTheme(t)} className="capitalize">
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
