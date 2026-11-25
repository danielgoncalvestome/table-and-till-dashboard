import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const Ctx = createContext<{ dark: boolean; toggle: () => void }>({ dark: false, toggle: () => {} });

/** Scope the workspace theme, including portalled controls, to signed-in pages. */
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
    <Button variant="outline" size="icon" type="button" onClick={toggle} aria-label={dark ? "Modo claro" : "Modo escuro"} title={dark ? "Modo claro" : "Modo escuro"} className={`rounded-xl bg-card text-foreground/80 ${className}`}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export const usePanelTheme = () => useContext(Ctx);
