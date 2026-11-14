import { describe, expect, it } from "vitest";
import { canAccess, cleanPerms } from "@/lib/team-rules";
describe("Team permissions", () => {
  it("reservations access does not grant room editing", () => {
    expect(canAccess("staff", { reservations: true }, "room_edit")).toBe(false);
  });
  it("room editing requires an explicit grant for staff and managers", () => {
    for (const role of ["staff", "manager"]) {
      expect(canAccess(role, {}, "room_edit")).toBe(false);
      expect(canAccess(role, { room_edit: true }, "room_edit")).toBe(true);
      expect(canAccess(role, { room_edit: false }, "room_edit")).toBe(false);
    }
  });
  it("owners retain room editing", () => {
    expect(canAccess("owner", {}, "room_edit")).toBe(true);
  });
  it("room permission is saved and defaults to denied", () => {
    expect(cleanPerms({ room_edit: true }).room_edit).toBe(true);
    expect(cleanPerms({ reservations: true }).room_edit).toBe(false);
  });
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
