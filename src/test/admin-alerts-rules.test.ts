import { describe, expect, it } from "vitest";
import { trialWarning, platformAlerts } from "@/lib/admin-alerts-rules";
const now = new Date("2026-11-11T12:00:00Z").getTime();
const iso = (d: number) => new Date(now + d * 864e5).toISOString();
describe("trial alerts", () => {
  it("warns 3 days before the trial ends", () => expect(trialWarning(iso(3), false, now)).toEqual({ kind: "ending", days: 3 }));
  it("does not warn 4 days before", () => expect(trialWarning(iso(4), false, now)).toBeNull());
  it("does not warn when a paid plan exists", () => expect(trialWarning(iso(1), true, now)).toBeNull());
  it("flags expired trials", () => expect(trialWarning(iso(-1), false, now)?.kind).toBe("expired"));
  it("admin sees expired trial as high", () => {
    const a = platformAlerts([{ id: "r", name: "X", created_by: "u", published: true, is_demo: false, trial_ends_at: iso(-2), created_at: iso(-20) }], [], 0, now);
    expect(a[0].level).toBe("high");
  });
});

describe("device alerts", () => {
  const r = [{ id: "r1", name: "Cantina", created_by: "u", published: true, is_demo: false, trial_ends_at: null, created_at: iso(-20) }];
  it("flags a device mismatch with the restaurant name", () => {
    const a = platformAlerts(r, [], 0, now, { r1: { devices: 2, submitted: 3, tables: 3 } });
    expect(a.map((x) => x.text)).toContain("Cantina: Dispositivos em falta");
    const hit = a.find((x) => x.text.includes("Dispositivos"));
    expect(hit?.restaurantId).toBe("r1");
    expect(hit?.level).toBe("medium");
  });
  it("flags a changed floor plan", () => {
    const a = platformAlerts(r, [], 0, now, { r1: { devices: 3, submitted: 2, tables: 3 } });
    expect(a.map((x) => x.text)).toContain("Cantina: A planta mudou: 3 mesas ativas, 2 na última submissão.");
  });
  it("stays silent when devices and tables match", () => {
    expect(platformAlerts(r, [], 0, now, { r1: { devices: 3, submitted: 3, tables: 3 } })).toEqual([]);
  });
});
