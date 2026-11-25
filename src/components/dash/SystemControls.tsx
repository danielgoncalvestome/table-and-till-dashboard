import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Clock, LogOut, Moon, PanelBottom, PanelLeftOpen, Sun } from "lucide-react";
import { usePanelTheme } from "@/lib/panel-theme";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const i = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(i); }, []);
  return now ? now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }) : "--:--";
}

/** Theme, notifications, clock, sign-out and sidebar/dock switch, as a list (sidebar) or mini bar (dock). */
export function SystemControls({ variant, onSignOut, onCollapse }: { variant: "list" | "mini"; onSignOut: () => void; onCollapse?: () => void }) {
  const { dark, toggle } = usePanelTheme();
  const time = useClock();
  const ThemeIcon = dark ? Sun : Moon;
  if (variant === "mini") {
    const b = "grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground";
    return (
      <>
        <button type="button" onClick={toggle} className={b} title={dark ? "Modo claro" : "Modo escuro"} aria-label={dark ? "Modo claro" : "Modo escuro"}><ThemeIcon className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={onSignOut} className={b} title="Sair" aria-label="Sair"><LogOut className="h-3.5 w-3.5" /></button>
        <Link to="/dashboard" className={b} title="Notificações" aria-label="Notificações"><Bell className="h-3.5 w-3.5" /></Link>
        <span className="px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">{time}</span>
        {onCollapse && <button type="button" onClick={onCollapse} className={b} title="Menu lateral" aria-label="Voltar ao menu lateral"><PanelLeftOpen className="h-3.5 w-3.5" /></button>}
      </>
    );
  }
  const r = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[5px] text-left text-[13px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground";
  return (
    <>
      <button type="button" onClick={toggle} className={r}><ThemeIcon className="h-4 w-4" />{dark ? "Modo claro" : "Modo escuro"}</button>
      <Link to="/dashboard" className={r}><Bell className="h-4 w-4" />Notificações</Link>
      <div className={`${r} pointer-events-none`}><Clock className="h-4 w-4" /><span className="tabular-nums">{time}</span></div>
      <button type="button" onClick={onSignOut} className={r}><LogOut className="h-4 w-4" />Sair</button>
      {onCollapse && <button type="button" onClick={onCollapse} className={r}><PanelBottom className="h-4 w-4" />Mudar para Dock</button>}
    </>
  );
}
