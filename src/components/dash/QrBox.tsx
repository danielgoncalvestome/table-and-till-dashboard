import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QrBox({ slug, color, nfc = false }: { slug: string; color: string; nfc?: boolean }) {
  const [origin, setOrigin] = useState("");
  const [png, setPng] = useState("");
  useEffect(() => setOrigin("https://menutap.pt"), []);
  const url = `${origin}/r/${slug}`;
  useEffect(() => {
    if (origin) QRCode.toDataURL(`${url}?src=qr`, { margin: 2, width: 1024, color: { dark: color, light: "#FFFFFF" }, errorCorrectionLevel: "M" }).then(setPng);
  }, [origin, url, color]);
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copiado"); };
  const row = (label: string, v: string) => (
    <div><p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1 font-mono text-xs">
        <a href={v} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">{v.replace(/^https?:\/\//, "")}</a>
        <Button size="icon" variant="ghost" aria-label="Copiar" onClick={() => copy(v)}><Copy /></Button>
      </div></div>
  );
  return (
    <div className="space-y-3">
      {png && <img src={png} alt="QR" className="mx-auto w-36 rounded-lg" />}
      {row("Link", url)}
      {nfc && row("Link NFC", `${url}?src=nfc`)}
      <Button className="w-full" variant="outline" disabled={!png} onClick={() => { const a = document.createElement("a"); a.href = png; a.download = `${slug}-qr.png`; a.click(); }}><Download />PNG</Button>
    </div>
  );
}
