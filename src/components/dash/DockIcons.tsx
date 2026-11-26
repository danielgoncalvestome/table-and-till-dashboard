import { useId, type ReactNode } from "react";

// Uniform macOS-style squircle icons (vector) for the panel sidebar and Dock.
const SQ = "M50 2C88 2 98 12 98 50S88 98 50 98 2 88 2 50 12 2 50 2Z";

function Base({ from, to, className, children, light }: { from: string; to: string; className?: string; children: ReactNode; light?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity={light ? 0 : 0.28} /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <path d={SQ} fill={`url(#g${id})`} />
      <path d={SQ} fill={`url(#s${id})`} />
      <path d={SQ} fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="1" />
      {children}
    </svg>
  );
}
type P = { className?: string };
const W = { fill: "none", stroke: "#fff", strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconDashboard = ({ className }: P) => (
  <Base from="#ffffff" to="#e9ebef" light className={className}>
    <rect x="24" y="24" width="23" height="23" rx="6" fill="#0a84ff" /><rect x="53" y="24" width="23" height="23" rx="6" fill="#30d158" />
    <rect x="24" y="53" width="23" height="23" rx="6" fill="#bf5af2" /><rect x="53" y="53" width="23" height="23" rx="6" fill="#64d2ff" />
  </Base>
);
export const IconReservas = ({ className }: P) => (
  <Base from="#ffffff" to="#eceef1" light className={className}>
    <path d="M24 30a6 6 0 0 1 6-6h40a6 6 0 0 1 6 6v8H24Z" fill="#ff3b30" />
    <rect x="24" y="24" width="52" height="54" rx="6" fill="none" stroke="#d1d4da" strokeWidth="2" />
    <path d="M37 58l9 9 18-19" {...W} stroke="#30d158" strokeWidth="7" />
  </Base>
);
export const IconSalas = ({ className }: P) => (
  <Base from="#4cd964" to="#1f9d4c" className={className}>
    <ellipse cx="50" cy="50" rx="17" ry="17" fill="#fff" />
    {[[50, 22], [50, 78], [22, 50], [78, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6.5" fill="#fff" fillOpacity="0.85" />)}
  </Base>
);
export const IconPedidos = ({ className }: P) => (
  <Base from="#ff6b5e" to="#e0262b" className={className}>
    <path d="M34 60c-8-2-12-8-11-15 1-8 9-12 16-10 2-6 7-10 11-10s9 4 11 10c7-2 15 2 16 10 1 7-3 13-11 15Z" fill="#fff" />
    <rect x="34" y="63" width="32" height="12" rx="3" fill="#fff" />
  </Base>
);
export const IconMenus = ({ className }: P) => (
  <Base from="#ffd60a" to="#f5a300" className={className}>
    <path d="M36 24v16a6 6 0 0 0 6 6v30M30 24v14M42 24v14" {...W} />
    <path d="M62 76V24c-6 3-9 12-9 22h9" {...W} />
  </Base>
);
export const IconDesign = ({ className }: P) => (
  <Base from="#c77dff" to="#8b3ad8" className={className}>
    <path d="M74 24L48 52" {...W} strokeWidth="8" />
    <path d="M44 55c-8 0-13 5-13 12 0 4-3 7-6 8 12 3 25-1 26-13Z" fill="#fff" />
  </Base>
);
export const IconAnalise = ({ className }: P) => (
  <Base from="#4ea8ff" to="#0a63d8" className={className}>
    <rect x="25" y="54" width="12" height="22" rx="3" fill="#fff" /><rect x="44" y="40" width="12" height="36" rx="3" fill="#fff" />
    <rect x="63" y="25" width="12" height="51" rx="3" fill="#fff" />
  </Base>
);
const star = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;
export const IconIntelligence = ({ className }: P) => (
  <Base from="#9b6bff" to="#5b2bd6" className={className}>
    <path d={star(45, 54, 24)} fill="#fff" /><path d={star(70, 30, 10)} fill="#fff" fillOpacity="0.9" />
  </Base>
);
export const IconDefinicoes = ({ className }: P) => (
  <Base from="#9aa3ad" to="#5f6873" className={className}>
    <g transform="translate(50 50)" fill="#fff">
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x="-5" y="-30" width="10" height="14" rx="3" transform={`rotate(${i * 45})`} />)}
      <circle r="20" />
    </g>
    <circle cx="50" cy="50" r="8" fill="#7a838d" />
  </Base>
);
