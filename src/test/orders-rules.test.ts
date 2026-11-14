import { describe, it, expect } from "vitest";
import { cartTotal, deviceWarnings, orderOptions } from "@/lib/orders";
describe("orders rules", () => {
  it("options default on and can be disabled", () => { expect(orderOptions({ sound: false })).toEqual({ statuses: true, sound: false, notes: true, bill: true }); });
  it("cart total", () => { expect(cartTotal([{ price: 9.9, qty: 2 }, { price: 1.5, qty: 1 }])).toBe(21.3); });
  it("warns when tables changed since submission", () => { expect(deviceWarnings(10, 8, 10)).toHaveLength(1); expect(deviceWarnings(10, 10, 10)).toHaveLength(0); });
});
