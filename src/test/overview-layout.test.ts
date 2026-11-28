import { describe, it, expect } from "vitest";
import { DEFAULT_LAYOUT, OVERVIEW_COLUMNS, OVERVIEW_ROWS, normalizeLayout } from "@/lib/overview-layout";

describe("overview layout", () => {
  it("keeps saved order, migrates legacy widths and appends missing widgets", () => {
    const l = normalizeLayout([{ id: "orders", wide: true, hidden: false }, { id: "bogus" }]);
    expect(l[0]).toEqual({ id: "orders", w: OVERVIEW_COLUMNS, h: 3, hidden: false });
    expect(l).toHaveLength(DEFAULT_LAYOUT.length);
  });
  it("falls back to default on invalid data", () => {
    expect(normalizeLayout(null)).toBe(DEFAULT_LAYOUT);
  });
  it("limits every widget to the screen grid", () => {
    const l = normalizeLayout([{ id: "orders", w: 99, h: 99, hidden: false }]);
    expect(l[0]?.w).toBe(OVERVIEW_COLUMNS);
    expect(l[0]?.h).toBe(OVERVIEW_ROWS);
  });
  it("rejects zero and negative widget sizes", () => {
    const l = normalizeLayout([{ id: "orders", w: 0, h: -4, hidden: false }]);
    expect(l[0]?.w).toBe(2);
    expect(l[0]?.h).toBe(1);
  });
});
