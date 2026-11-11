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
