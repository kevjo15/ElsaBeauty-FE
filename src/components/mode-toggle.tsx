import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    setTheme(theme === "dark" ? "cupcake" : "dark");
  };

  return (
    <label className="swap swap-rotate cursor-pointer">
      <input
        type="checkbox"
        checked={theme === "dark"}
        onChange={handleToggle}
      />
      <Sun className="swap-on h-[1.2rem] w-[1.2rem]" />
      <Moon className="swap-off h-[1.2rem] w-[1.2rem]" />
    </label>
  );
}
