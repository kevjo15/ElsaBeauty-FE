import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeName =
  | "salon-rose"
  | "salon-noir-gold"
  | "salon-emerald"
  | "salon-sand"
  | "salon-blush"
  | "salon-olive"
  | "salon-ivory-gold"
  | "light"
  | "dark"
  | "cupcake"
  | "bumblebee"
  | "emerald"
  | "corporate"
  | "synthwave"
  | "retro"
  | "cyberpunk"
  | "valentine"
  | "halloween"
  | "garden"
  | "forest"
  | "aqua"
  | "lofi"
  | "pastel"
  | "fantasy"
  | "wireframe"
  | "black"
  | "luxury"
  | "dracula"
  | "cmyk"
  | "autumn"
  | "business"
  | "acid"
  | "lemonade"
  | "night"
  | "coffee"
  | "winter"
  | "dim"
  | "nord"
  | "sunset"
  | "caramellatte"
  | "abyss"
  | "silk";

type Mode = "light" | "dark";
type Theme = ThemeName | "system";

/** VÄLJ HÄR vilka teman som ska vara light/dark */
export const LIGHT_THEME: ThemeName = "salon-blush"; // <- ändra t.ex. till "salon-sand"
export const DARK_THEME: ThemeName = "dracula"; // <- ändra t.ex. till "salon-emerald"

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

function toMode(theme: Theme): Mode {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme === DARK_THEME ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = LIGHT_THEME, // <- default vid första laddning
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const { effectiveTheme, mode } = useMemo(() => {
    const m = toMode(theme);
    return { effectiveTheme: themeMap[m], mode: m };
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
