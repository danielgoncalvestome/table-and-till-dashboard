import { getPaddleEnvironment } from "@/lib/paddle";
export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return <div className="w-full border-b border-border bg-muted px-4 py-2 text-center text-sm text-muted-foreground">Todos os pagamentos na pré-visualização estão em modo de teste. <a href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer" className="font-medium underline">Saber mais</a></div>;
}
