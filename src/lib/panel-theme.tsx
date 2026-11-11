import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

const Ctx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });

/** Applies the white/black panel theme to <html> while the signed-in area is mounted. */
export function PanelThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(localStorage.getItem("mt-panel-theme") === "dark"); }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.add("panel");
    el.classList.toggle("dark", dark);
    return () => { el.classList.remove("panel", "dark"); };
  }, [dark]);
  const toggle = () => setDark((d) => { localStorage.setItem("mt-panel-theme", d ? "light" : "dark"); return !d; });
  return <Ctx.Provider value={{ dark, toggle }}>{children}</Ctx.Provider>;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { dark, toggle } = useContext(Ctx);
  return (
    <button type="button" onClick={toggle} aria-label={dark ? "Modo claro" : "Modo escuro"} title={dark ? "Modo claro" : "Modo escuro"} className={`grid h-9 w-9 place-items-center rounded-full border bg-card text-foreground transition-colors hover:bg-muted ${className}`}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
