import { describe, expect, it } from "vitest";
import { isMenuActive, tr } from "@/lib/menu";

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
