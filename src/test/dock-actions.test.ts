import { describe, expect, it } from "vitest";
import { DEFAULT_DOCK_ACTIONS, MAX_DOCK_ACTIONS, normalizeDockActions, toggleDockAction } from "@/lib/dock-actions";

describe("Dock quick actions", () => {
  it("uses the three useful defaults for a new restaurant", () => {
    expect(normalizeDockActions(null)).toEqual(DEFAULT_DOCK_ACTIONS);
  });
  it("removes duplicates, unknown actions and entries above the limit", () => {
    const result = normalizeDockActions(["orders", "orders", "bogus", "room", "menus", "design", "analytics", "intelligence", "new-dish"]);
    expect(result).toHaveLength(MAX_DOCK_ACTIONS);
    expect(result).not.toContain("new-dish");
  });
  it("does not add a seventh quick action", () => {
    const six = ["orders", "room", "menus", "design", "analytics", "intelligence"] as const;
    expect(toggleDockAction([...six], "new-dish")).toEqual(six);
  });
  it("can remove an existing action", () => {
    expect(toggleDockAction(["orders", "room"], "orders")).toEqual(["room"]);
  });
});
