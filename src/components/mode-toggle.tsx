import { useTheme, LIGHT_THEME, DARK_THEME } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === DARK_THEME;

  return (
    <label className="swap swap-rotate cursor-pointer">
      <input
        type="checkbox"
        checked={isDark}
        onChange={() => setTheme(isDark ? LIGHT_THEME : DARK_THEME)}
        aria-label="Toggle theme"
      />
      <Moon className="swap-on h-[1.2rem] w-[1.2rem]" />
      <Sun className="swap-off h-[1.2rem] w-[1.2rem]" />
    </label>
  );
}
