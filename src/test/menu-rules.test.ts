import { describe, expect, it, vi, beforeEach } from "vitest";
import { isMenuActive, tr, track } from "@/lib/menu";

const sent = vi.hoisted(() => ({
  rows: [] as { table: string; row: Record<string, unknown> }[],
  thenCalled: false,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => {
        sent.rows.push({ table, row });
        // supabase-js builders only run the request when .then() is called.
        return {
          then: (onFulfilled: (v: { error: null }) => unknown) => {
            sent.thenCalled = true;
            return Promise.resolve().then(() => onFulfilled({ error: null }));
          },
        };
      },
    }),
  },
}));

describe("menu rules", () => {
  it("falls back to Portuguese when a translation is missing", () => {
    expect(tr("Polvo", {}, "en")).toBe("Polvo");
    expect(tr("Polvo", { en: "Octopus" }, "en")).toBe("Octopus");
  });
  it("shows lunch menu only in its Lisbon time window", () => {
    const lunch = { schedule_days: [0, 1, 2, 3, 4, 5, 6], schedule_start: "12:00", schedule_end: "15:30" };
    expect(isMenuActive(lunch, new Date("2026-01-14T13:00:00Z"))).toBe(true); // Lisbon = UTC in winter
    expect(isMenuActive(lunch, new Date("2026-01-14T19:00:00Z"))).toBe(false);
  });
});

describe("analytics tracking", () => {
  beforeEach(() => {
    sent.rows.length = 0;
    sent.thenCalled = false;
  });

  it("sends the event row to the database instead of only building the query", () => {
    track("00000000-0000-4000-a000-000000000001", "menu_view", { lang: "pt", source: "qr" });
    expect(sent.rows).toHaveLength(1);
    expect(sent.rows[0].table).toBe("analytics_events");
    expect(sent.rows[0].row).toMatchObject({ event_type: "menu_view", lang: "pt", source: "qr" });
    // Regression guard: `void insert(...)` built the request but never ran it, so no view was ever stored.
    expect(sent.thenCalled).toBe(true);
  });

  it("cuts search text to 80 characters so the insert passes the database policy", () => {
    track("00000000-0000-4000-a000-000000000001", "search", { query: "x".repeat(200) });
    expect(sent.rows).toHaveLength(1);
    expect(String(sent.rows[0].row.query)).toHaveLength(80);
    expect(sent.thenCalled).toBe(true);
  });
});
