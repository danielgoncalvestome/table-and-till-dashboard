import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Download, ExternalLink, Printer, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/dash/ui";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";

export const Route = createFileRoute("/_authenticated/dashboard/qr")({ component: Qr });

function Qr() {
  const { t } = useI18n();
  const { restaurant: r } = useRestaurant();
  const [origin, setOrigin] = useState("");
  const [png, setPng] = useState("");
  const [svg, setSvg] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/r/${r.slug}`;
  const qrUrl = `${url}?src=qr`;
  const nfcUrl = `${url}?src=nfc`;
  useEffect(() => {
    if (!origin) return;
    const opts = { margin: 2, width: 1024, color: { dark: r.primary_color, light: "#FFFFFF" }, errorCorrectionLevel: "M" as const };
    QRCode.toDataURL(qrUrl, opts).then(setPng);
    QRCode.toString(qrUrl, { ...opts, type: "svg" }).then(setSvg);
  }, [origin, qrUrl, r.primary_color]);

  const dl = (href: string, name: string) => { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); };
  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${r.name}</title></head><body style="font-family:Georgia,serif;display:flex;justify-content:center;padding:40px;background:#fff"><div style="width:9cm;border:1px solid #ddd;padding:1cm;text-align:center;color:${r.primary_color}"><h2 style="margin:0 0 8px">${r.name}</h2><p style="font-size:12px;margin:0 0 12px">Menu · Scan or tap</p><img src="${png}" style="width:6cm;height:6cm"/><p style="font-size:10px">${url.replace(/^https?:\/\//, "")}</p></div><script>onload=()=>print()</script></body></html>`);
    w.document.close();
  }
  return (
    <div>
      <PageTitle title={t("qr.title")} />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t("qr.url")}>
          <div className="flex items-center gap-2 rounded bg-muted p-3 font-mono text-sm"><span className="truncate">{url}</span>
            <Button size="icon" variant="ghost" aria-label={t("common.copy")} onClick={() => { navigator.clipboard.writeText(url); toast.success(t("common.copied")); }}><Copy /></Button>
          </div>
          {png && <img src={png} alt="QR" className="mx-auto mt-6 w-56" />}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => dl(png, `${r.slug}-qr.png`)} disabled={!png}><Download />{t("qr.png")}</Button>
            <Button variant="outline" onClick={() => dl(URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), `${r.slug}-qr.svg`)} disabled={!svg}><Download />{t("qr.svg")}</Button>
            <Button variant="outline" onClick={print} disabled={!png}><Printer />{t("qr.print")}</Button>
            <Button variant="ghost" asChild><a href={qrUrl} target="_blank" rel="noreferrer">{t("qr.test")} <ExternalLink /></a></Button>
          </div>
        </Panel>
        <Panel title={t("qr.nfc")}>
          <p className="text-sm text-muted-foreground">{t("qr.nfcHelp")}</p>
          <div className="mt-4 flex items-center gap-2 rounded bg-muted p-3 font-mono text-sm"><span className="truncate">{nfcUrl}</span>
            <Button size="icon" variant="ghost" aria-label={t("common.copy")} onClick={() => { navigator.clipboard.writeText(nfcUrl); toast.success(t("common.copied")); }}><Copy /></Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
