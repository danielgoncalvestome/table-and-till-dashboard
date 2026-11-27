import { useId, type ReactNode } from "react";

// Detailed macOS-style squircle icons (vector) using Apple system colours.
const SQ = "M50 2C88 2 98 12 98 50S88 98 50 98 2 88 2 50 12 2 50 2Z";
type P = { className?: string };

function Base({ from, to, className, children, defs }: { from: string; to: string; className?: string; children: (id: string) => ReactNode; defs?: (id: string) => ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.32" /><stop offset="0.45" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <filter id={`d${id}`} x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2.2" stdDeviation="1.8" floodColor="#000" floodOpacity="0.28" /></filter>
        <clipPath id={`c${id}`}><path d={SQ} /></clipPath>
        {defs?.(id)}
      </defs>
      <path d={SQ} fill={`url(#g${id})`} />
      <g clipPath={`url(#c${id})`}>{children(id)}</g>
      <path d={SQ} fill={`url(#s${id})`} />
      <path d={SQ} fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="0.8" />
    </svg>
  );
}
const sh = (id: string) => `url(#d${id})`;

export const IconDashboard = ({ className }: P) => (
  <Base from="#fbfbfd" to="#e3e5ea" className={className} defs={(id) => (<>
    {[["a", "#5ac8fa", "#007aff"], ["b", "#5de38a", "#34c759"], ["q", "#d78bff", "#af52de"], ["e", "#ffb340", "#ff9500"]].map(([k, a, b]) => (
      <linearGradient key={k} id={`${k}${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>))}
  </>)}>
    {(id) => <g filter={sh(id)}>
      <rect x="20" y="20" width="27" height="27" rx="7" fill={`url(#a${id})`} /><rect x="53" y="20" width="27" height="27" rx="7" fill={`url(#b${id})`} />
      <rect x="20" y="53" width="27" height="27" rx="7" fill={`url(#q${id})`} /><rect x="53" y="53" width="27" height="27" rx="7" fill={`url(#e${id})`} />
      {[[20, 20], [53, 20], [20, 53], [53, 53]].map(([x, y]) => <rect key={`${x}${y}`} x={x! + 2} y={y! + 2} width="23" height="9" rx="5" fill="#fff" fillOpacity="0.22" />)}
    </g>}
  </Base>
);

export const IconReservas = ({ className }: P) => (
  <Base from="#ffffff" to="#e8eaef" className={className} defs={(id) => <linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6961" /><stop offset="1" stopColor="#ff3b30" /></linearGradient>}>
    {(id) => <>
      <g filter={sh(id)}>
        <rect x="18" y="24" width="64" height="58" rx="9" fill="#fff" />
        <path d="M18 33a9 9 0 0 1 9-9h46a9 9 0 0 1 9 9v7H18Z" fill={`url(#r${id})`} />
      </g>
      {[34, 66].map((x) => <g key={x}><rect x={x - 3} y="16" width="6" height="16" rx="3" fill="#8e8e93" /><rect x={x - 1.5} y="17" width="2" height="12" rx="1" fill="#fff" fillOpacity="0.5" /></g>)}
      {[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => r === 2 && c === 3 ? null :
        <rect key={`${r}${c}`} x={25 + c * 13} y={46 + r * 11} width="9" height="7" rx="2" fill="#d1d1d6" />))}
      <circle cx="69.5" cy="69.5" r="9" fill="#34c759" />
      <path d="M65 69.5l3 3 6-6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>}
  </Base>
);

export const IconSalas = ({ className }: P) => (
  <Base from="#4cd964" to="#248a3d" className={className}>
    {(id) => <>
      {Array.from({ length: 9 }, (_, i) => <g key={i} stroke="#fff" strokeOpacity="0.12" strokeWidth="0.7"><path d={`M${10 + i * 10} 0V100`} /><path d={`M0 ${10 + i * 10}H100`} /></g>)}
      <g filter={sh(id)} fill="#fff">
        <ellipse cx="50" cy="44" rx="20" ry="6.5" />
        <rect x="47.5" y="48" width="5" height="22" rx="2" />
        <ellipse cx="50" cy="71" rx="10" ry="3" />
        <path d="M18 38q2-3 4 0l2 18h9q3 0 3 3v3h-3l-2 12h-3l1-12h-6l-2 12h-3l2-14Z" />
        <path d="M82 38q-2-3-4 0l-2 18h-9q-3 0-3 3v3h3l2 12h3l-1-12h6l2 12h3l-2-14Z" />
      </g>
      <ellipse cx="50" cy="42.5" rx="14" ry="3" fill="#000" fillOpacity="0.05" />
    </>}
  </Base>
);

export const IconPedidos = ({ className }: P) => (
  <Base from="#ff6482" to="#ff2d55" className={className} defs={(id) => <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e5e5ea" /></linearGradient>}>
    {(id) => <g filter={sh(id)}>
      <path d="M30 60c-9-1-14-8-12-16 2-9 11-13 19-10 2-8 8-12 13-12s11 4 13 12c8-3 17 1 19 10 2 8-3 15-12 16Z" fill={`url(#h${id})`} />
      <path d="M40 40q2 8 1 20M60 40q-2 8-1 20M50 36v24" stroke="#c7c7cc" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <rect x="30" y="60" width="40" height="16" rx="4" fill="#f2f2f7" />
      <rect x="30" y="60" width="40" height="4" fill="#c7c7cc" fillOpacity="0.7" />
    </g>}
  </Base>
);

export const IconMenus = ({ className }: P) => (
  <Base from="#ffd60a" to="#ff9f0a" className={className} defs={(id) => <linearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6d0" /><stop offset="1" stopColor="#f5c542" /></linearGradient>}>
    {(id) => <>
      <g filter={sh(id)} fill="#fff">
        <path d="M30 20h3v16h3V20h3v16h3V20h3v18a7 7 0 0 1-5 6.7V80a3.5 3.5 0 0 1-7 0V44.7A7 7 0 0 1 27 38V20Z" />
        <path d="M64 18c-8 3-11 14-11 26 0 4 2 6 5 6h2v30a3.5 3.5 0 0 0 7 0V20q0-3-3-2Z" />
      </g>
      <path d="M100 66 66 100h34Z" fill="#000" fillOpacity="0.15" />
      <path d="M68 100q2-20 32-32-6 18-32 32Z" fill={`url(#p${id})`} filter={sh(id)} />
    </>}
  </Base>
);

export const IconDesign = ({ className }: P) => (
  <Base from="#bf5af2" to="#5e2b97" className={className} defs={(id) => <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e5e5ea" /></linearGradient>}>
    {(id) => <>
      <path d="M0 74q25-14 50-2t50-6v34H0Z" fill="#da8fff" fillOpacity="0.45" />
      <path d="M0 84q30-12 55-2t45-4v22H0Z" fill="#ff7dd8" fillOpacity="0.55" />
      <g filter={sh(id)}>
        <path d="M78 18q4-2 5 2 0 3-3 6L54 58l-7-6Z" fill={`url(#b${id})`} />
        <path d="M47 52l7 6-3 3-7-6Z" fill="#aeaeb2" />
        <path d="M43 56l7 6c-2 10-10 16-24 14 5-3 6-6 6-10 0-6 5-10 11-10Z" fill={`url(#b${id})`} />
      </g>
    </>}
  </Base>
);

export const IconAnalise = ({ className }: P) => (
  <Base from="#64d2ff" to="#007aff" className={className} defs={(id) => <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dbe9ff" /></linearGradient>}>
    {(id) => <>
      <path d="M0 80q30-10 55 0t45-6v26H0Z" fill="#fff" fillOpacity="0.12" />
      {[22, 34, 46, 58, 70].map((y) => <path key={y} d={`M18 ${y}H82`} stroke="#fff" strokeOpacity="0.14" strokeWidth="0.8" />)}
      <g filter={sh(id)} fill={`url(#b${id})`}>
        <rect x="22" y="54" width="14" height="24" rx="4" /><rect x="43" y="40" width="14" height="38" rx="4" /><rect x="64" y="24" width="14" height="54" rx="4" />
      </g>
      <path d="M25 46 46 32l12 6 18-16" fill="none" stroke="#ffd60a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="76" cy="22" r="3" fill="#ffd60a" />
    </>}
  </Base>
);

const star = (cx: number, cy: number, r: number) => `M${cx} ${cy - r}Q${cx + r * 0.12} ${cy - r * 0.12} ${cx + r} ${cy}Q${cx + r * 0.12} ${cy + r * 0.12} ${cx} ${cy + r}Q${cx - r * 0.12} ${cy + r * 0.12} ${cx - r} ${cy}Q${cx - r * 0.12} ${cy - r * 0.12} ${cx} ${cy - r}Z`;
export const IconIntelligence = ({ className }: P) => (
  <Base from="#a78bfa" to="#5856d6" className={className} defs={(id) => <>
    <radialGradient id={`l${id}`}><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
    <linearGradient id={`t${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e4dcff" /></linearGradient>
  </>}>
    {(id) => <>
      <circle cx="45" cy="55" r="30" fill={`url(#l${id})`} />
      <path d="M0 78q35-14 100 4v18H0Z" fill="#fff" fillOpacity="0.1" />
      <g filter={sh(id)}>
        <path d={star(45, 55, 26)} fill={`url(#t${id})`} />
        <path d={star(72, 28, 10)} fill="#fff" />
        <path d={star(74, 70, 6)} fill="#fff" fillOpacity="0.8" />
      </g>
    </>}
  </Base>
);

export const IconDefinicoes = ({ className }: P) => (
  <Base from="#aeaeb2" to="#636366" className={className} defs={(id) => <>
    <linearGradient id={`m${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d1d1d6" /></linearGradient>
    <linearGradient id={`n${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#48484a" /><stop offset="1" stopColor="#8e8e93" /></linearGradient>
  </>}>
    {(id) => <>
      <g transform="translate(50 50)" filter={sh(id)} fill={`url(#m${id})`}>
        {Array.from({ length: 10 }, (_, i) => <rect key={i} x="-5.5" y="-33" width="11" height="14" rx="2.5" transform={`rotate(${i * 36})`} />)}
        <circle r="24" />
      </g>
      <circle cx="50" cy="50" r="15" fill={`url(#n${id})`} />
      <circle cx="50" cy="50" r="10.5" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="5" fill="#d1d1d6" />
    </>}
  </Base>
);
