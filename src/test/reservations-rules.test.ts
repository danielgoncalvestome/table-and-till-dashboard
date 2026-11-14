import { describe, it, expect } from "vitest";
import { isLate } from "@/lib/reservations";
describe("no-show tolerance", () => {
  const start = "2026-01-01T20:00:00Z";
  it("not late within tolerance", () => expect(isLate("confirmed", start, 15, Date.parse("2026-01-01T20:14:00Z"))).toBe(false));
  it("late after tolerance", () => expect(isLate("confirmed", start, 15, Date.parse("2026-01-01T20:16:00Z"))).toBe(true));
  it("seated never late", () => expect(isLate("seated", start, 15, Date.parse("2026-01-01T22:00:00Z"))).toBe(false));
});
