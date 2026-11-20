import { useEffect, useState } from "react";
import c from "@/assets/crumb-c.png.asset.json";
import cLight from "@/assets/crumb-c-light.png.asset.json";
import rumb from "@/assets/crumb-rumb.png.asset.json";
import rumbLight from "@/assets/crumb-rumb-light.png.asset.json";

/** Animated Crumb logo: "rumb" fades away, the C slides to the centre and rotates 90° into the icon. */
export function CrumbMorph({
  variant = "dark",
  heightPx = 48,
  collapsed,
  loop = false,
  className = "",
}: {
  variant?: "dark" | "light";
  heightPx?: number;
  collapsed?: boolean;
  loop?: boolean;
  className?: string;
}) {
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => setAuto((v) => !v), 2600);
    return () => clearInterval(id);
  }, [loop]);
  const isIcon = collapsed ?? auto;
  const h = heightPx;
  const cW = (435 / 390) * h;
  const rW = (1320 / 390) * h;
  return (
    <span
      role="img"
      aria-label="Crumb"
      data-state={isIcon ? "icon" : "full"}
      className={`crumb-morph relative inline-flex items-center justify-center ${className}`}
      style={{ height: h, width: isIcon ? cW : cW + rW }}
    >
      <img
        src={variant === "light" ? cLight.url : c.url}
        alt=""
        className="crumb-morph-c absolute left-0 top-0"
        style={{ height: h, width: cW }}
      />
      <img
        src={variant === "light" ? rumbLight.url : rumb.url}
        alt=""
        className="crumb-morph-rumb absolute top-0"
        style={{ height: h, width: rW, left: cW }}
      />
    </span>
  );
}
