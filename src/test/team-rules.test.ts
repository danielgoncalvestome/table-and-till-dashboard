import { describe, expect, it } from "vitest";
import { canAccess } from "@/lib/team-rules";
describe("Team permissions", () => {
  it("staff only reaches pages ticked in their grid", () => {
    expect(canAccess("staff", { reservations: true }, "reservations")).toBe(true);
    expect(canAccess("staff", { reservations: true }, "menus")).toBe(false);
  });
  it("team and subscription are owner-only", () => {
    expect(canAccess("staff", { menus: true, settings: true }, "team")).toBe(false);
    expect(canAccess("manager", {}, "subscription")).toBe(false);
    expect(canAccess("owner", {}, "team")).toBe(true);
  });
});
