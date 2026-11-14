import { describe, it, expect } from "vitest";
import { DEFAULT_LAYOUT, normalizeLayout } from "@/lib/overview-layout";
describe("overview layout", () => {
  it("keeps saved order and appends missing sections", () => {
    const l = normalizeLayout([{ id: "orders", wide: true, hidden: false }, { id: "bogus" }]);
    expect(l[0]).toEqual({ id: "orders", wide: true, hidden: false });
    expect(l).toHaveLength(DEFAULT_LAYOUT.length);
  });
  it("falls back to default on invalid data", () => { expect(normalizeLayout(null)).toBe(DEFAULT_LAYOUT); });
});
