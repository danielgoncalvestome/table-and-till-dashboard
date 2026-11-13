import type { CSSProperties } from "react";
import { FONTS } from "@/lib/menu";

export type TextStyle = { font?: string; color?: string; size?: number; upper?: boolean };
export type TextStyles = Partial<Record<SectionId, TextStyle>>;

export const TEXT_SECTIONS = [
  { id: "name", pt: "Nome do restaurante", en: "Restaurant name" },
  { id: "menus", pt: "Menus (separadores)", en: "Menus (tabs)" },
  { id: "nav", pt: "Barra de categorias", en: "Category bar" },
  { id: "category", pt: "Títulos das categorias", en: "Category titles" },
  { id: "dish", pt: "Nomes dos pratos", en: "Dish names" },
  { id: "description", pt: "Descrições", en: "Descriptions" },
  { id: "price", pt: "Preços", en: "Prices" },
  { id: "featured", pt: "Título «Recomendados»", en: "“Recommended” title" },
] as const;
export type SectionId = (typeof TEXT_SECTIONS)[number]["id"];

export function textStyle(styles: unknown, id: SectionId): CSSProperties {
  const s = ((styles ?? {}) as TextStyles)[id];
  if (!s) return {};
  const out: CSSProperties = {};
  const f = s.font && FONTS.find((x) => x.id === s.font)?.css;
  if (f) out.fontFamily = f;
  if (s.color) out.color = s.color;
  if (s.size) out.fontSize = `${s.size}px`;
  if (s.upper !== undefined) out.textTransform = s.upper ? "uppercase" : "none";
  return out;
}
