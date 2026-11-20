import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FONTS } from "@/lib/menu";
import { textStyle } from "@/lib/text-styles";
import { resError, todayStr } from "@/lib/reservations";

export const Route = createFileRoute("/r/$slug_/reservar")({
  head: () => ({ meta: [{ title: "Reservar mesa — Crumb" }, { name: "description", content: "Reserve a sua mesa online em poucos passos." }, { property: "og:title", content: "Reservar mesa — Crumb" }, { property: "og:description", content: "Reserve a sua mesa online em poucos passos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Book,
});

function Book() {
  const { slug } = Route.useParams();
  const { data: info, isLoading } = useQuery({ queryKey: ["book-info", slug], queryFn: async () => (await supabase.rpc("public_booking_info", { _slug: slug })).data?.[0] ?? null });
  const [step, setStep] = useState(1);
  const [party, setParty] = useState(2);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState("");
  const [f, setF] = useState({ name: "", phone: "", email: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { data: slots, isFetching } = useQuery({ queryKey: ["slots", slug, date, party], enabled: step === 2, queryFn: async () => (await supabase.rpc("public_slots", { _slug: slug, _date: date, _party: party })).data?.map((s) => s.slot) ?? [] });

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">A carregar…</div>;
  if (!info) return <div className="grid min-h-screen place-items-center p-6 text-center text-muted-foreground">As reservas online não estão disponíveis para este restaurante.</div>;
  const d = { primary_color: info.primary_color, background_color: info.background_color, accent_color: "", font: "", logo_url: info.logo_url, cover_url: "", cover_color: "", text_styles: {}, ...((info.booking_design ?? {}) as Record<string, unknown>) } as { primary_color: string; background_color: string; accent_color: string; font: string; logo_url: string; cover_url: string; cover_color: string; text_styles: unknown };
  const ts = d.text_styles;
  const btn = { background: d.accent_color || d.primary_color, ...textStyle(ts, "bk_button") };
  const fontCss = FONTS.find((x) => x.id === d.font)?.css;
  const max = new Date(); max.setDate(max.getDate() + info.max_days_ahead);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase.rpc("public_book", { _slug: slug, _date: date, _time: time, _party: party, _name: f.name, _phone: f.phone, _email: f.email, _notes: f.notes });
    setBusy(false);
    if (error) return setErr(resError(error.message));
    setStep(4);
  }

  return (
    <div className="min-h-screen" style={{ background: d.background_color, color: d.primary_color, fontFamily: fontCss }}>
      {(d.cover_url || d.cover_color) && <div className="h-40 bg-cover bg-center" style={{ backgroundImage: d.cover_url ? `url(${d.cover_url})` : undefined, backgroundColor: d.cover_url ? undefined : d.cover_color }} />}
      <div className={`mx-auto max-w-md px-5 ${d.cover_url || d.cover_color ? "-mt-28 pb-10" : "py-10"}`}>
        <div className="mb-8 text-center">
          {d.logo_url ? <img src={d.logo_url} alt={info.name} className="mx-auto h-20 w-auto object-contain" /> : <h1 className="text-3xl" style={textStyle(ts, "name")}>{info.name}</h1>}
          <p className="mt-3 text-sm opacity-70" style={textStyle(ts, "bk_title")}>Reservar mesa · passo {Math.min(step, 3)} de 3</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium" style={textStyle(ts, "bk_label")}>Quantas pessoas?</p>
                <div className="flex items-center justify-between rounded-lg border p-2">
                  <Button size="icon" variant="ghost" onClick={() => setParty(Math.max(1, party - 1))} aria-label="Menos"><Minus /></Button>
                  <span className="font-display text-3xl">{party}</span>
                  <Button size="icon" variant="ghost" onClick={() => setParty(Math.min(30, party + 1))} aria-label="Mais"><Plus /></Button>
                </div>
              </div>
              <div><p className="mb-2 text-sm font-medium" style={textStyle(ts, "bk_label")}>Data</p><Input type="date" value={date} min={todayStr()} max={todayStr(max)} onChange={(e) => setDate(e.target.value)} /></div>
              <Button className="w-full" style={btn} onClick={() => { setTime(""); setStep(2); }}>Ver horários</Button>
            </div>
          )}
          {step === 2 && (
            <div>
              <p className="mb-3 text-sm font-medium" style={textStyle(ts, "bk_label")}>Escolha a hora</p>
              {isFetching ? <p className="text-sm text-muted-foreground">A procurar mesas…</p> : slots?.length ? (
                <div className="grid grid-cols-4 gap-2">{slots.map((s) => <button key={s} onClick={() => { setTime(s); setStep(3); }} className="rounded-md border py-2 text-sm hover:bg-muted">{s}</button>)}</div>
              ) : <p className="text-sm text-muted-foreground">Sem disponibilidade nesse dia para {party} pessoas. Experimente outra data.</p>}
              <Button variant="ghost" className="mt-4" onClick={() => setStep(1)}>← Voltar</Button>
            </div>
          )}
          {step === 3 && (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-sm text-muted-foreground">{party} pessoas · {new Date(date).toLocaleDateString("pt-PT")} · {time}</p>
              <Input required placeholder="Nome" maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <Input type="tel" placeholder="Telefone" maxLength={30} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <Input type="email" placeholder="Email (opcional)" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <Textarea placeholder="Observações (alergias, aniversário…)" maxLength={500} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
              {err && <p className="text-sm text-destructive">{err}</p>}
              <div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setStep(2)}>← Voltar</Button><Button className="flex-1" disabled={busy} style={btn}>Confirmar reserva</Button></div>
            </form>
          )}
          {step === 4 && (
            <div className="py-6 text-center">
              <CalendarCheck className="mx-auto h-12 w-12" style={{ color: d.accent_color || d.primary_color }} />
              <h2 className="mt-4 text-2xl">Reserva confirmada</h2>
              <p className="mt-2 text-sm text-muted-foreground">{party} pessoas · {new Date(date).toLocaleDateString("pt-PT")} · {time}</p>
              <a href={`/r/${slug}`} className="mt-6 inline-block text-sm underline">Ver o menu</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
