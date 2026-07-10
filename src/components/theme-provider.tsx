import { createContext, useContext, useEffect, useMemo, useState } from "react";

/** Egna teman definierade i src/index.css */
type ThemeName =
  | "elsabeauty"
  | "elsabeauty-night"
  | "salon-rose"
  | "salon-emerald"
  | "salon-noir-gold"
  | "salon-sand"
  | "salon-blush"
  | "salon-olive"
  | "salon-ivory-gold";

type Mode = "light" | "dark";
type Theme = ThemeName | "system";

/**
 * Varumärkesparet som lampan i navbaren växlar mellan.
 * Håll i synk med FOUC-guarden i index.html.
 */
export const LIGHT_THEME: ThemeName = "elsabeauty";
export const DARK_THEME: ThemeName = "elsabeauty-night";

/** Teman som räknas som mörka (inkl. äldre sparade värden i localStorage). */
const DARK_THEMES = new Set<string>([DARK_THEME, "salon-noir-gold", "dracula"]);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};
type ThemeProviderState = { theme: Theme; setTheme: (theme: Theme) => void };

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const themeMap: Record<Mode, ThemeName> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
};

const KNOWN_THEMES = new Set<string>([
  "elsabeauty",
  "elsabeauty-night",
  "salon-rose",
  "salon-emerald",
  "salon-noir-gold",
  "salon-sand",
  "salon-blush",
  "salon-olive",
  "salon-ivory-gold",
]);

function toMode(theme: Theme): Mode {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return DARK_THEMES.has(theme) ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const { effectiveTheme, mode } = useMemo(() => {
    const m = toMode(theme);
    // Okända/legacy-värden (t.ex. borttagna stock-teman) faller tillbaka
    // på varumärkesparet utifrån sitt läge.
    const resolved =
      theme !== "system" && KNOWN_THEMES.has(theme)
        ? (theme as ThemeName)
        : themeMap[m];
    return { effectiveTheme: resolved, mode: m };
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", effectiveTheme);
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", mode === "light");
    root.style.colorScheme = mode;
  }, [effectiveTheme, mode]);

  const value = {
    theme,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setTheme(t);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeProviderContext);
  if (ctx === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
