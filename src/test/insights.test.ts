import { describe, expect, it } from "vitest";
import { fillRows, summarizeReservations } from "@/lib/insights";

describe("fillRows", () => {
  it("stretches a lone half-width section so no gap remains", () => {
    expect(fillRows([{ wide: true }, { wide: false }, { wide: true }])).toEqual([true, true, true]);
    expect(fillRows([{ wide: false }, { wide: false }, { wide: false }])).toEqual([false, false, true]);
    expect(fillRows([{ wide: false }, { wide: false }])).toEqual([false, false]);
  });
});

describe("summarizeReservations", () => {
  it("computes no-show rate from past seated/completed/no-show only, ignoring cancelled", () => {
    const base = { created_at: "2026-01-01T10:00:00Z", party: 2, source: "online", phone: "1", email: null, name: "A" };
    const s = summarizeReservations([
      { ...base, starts_at: "2026-01-02T20:00:00Z", status: "completed" },
      { ...base, starts_at: "2026-01-03T20:00:00Z", status: "no_show" },
      { ...base, starts_at: "2026-01-04T20:00:00Z", status: "cancelled" },
    ], Date.parse("2026-02-01"));
    expect(s.noShowRate).toBe(0.5);
    expect(s.total).toBe(2);
    expect(s.returning).toBe(1);
  });
});
