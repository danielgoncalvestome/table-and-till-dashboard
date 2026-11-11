import { describe, expect, it } from "vitest";
import { usernameSchema, usernameEmail, realAccountEmail, passwordChangeSchema } from "@/lib/account-rules";

describe("Account rules", () => {
  it("treats differently capitalised usernames as the same identity", () => {
    expect(usernameEmail(" Restaurante_1 ")).toBe(usernameEmail("restaurante_1"));
    expect(usernameSchema.safeParse("nome@site.pt").success).toBe(false);
  });
  it("allows accounts without a real email", () => {
    expect(realAccountEmail(usernameEmail("restaurante"))).toBeUndefined();
    expect(realAccountEmail("owner@example.com")).toBe("owner@example.com");
  });
  it("requires current password and matching new passwords", () => {
    expect(passwordChangeSchema.safeParse({ currentPassword: "", password: "newpassword", confirmation: "newpassword" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "oldpassword", password: "newpassword", confirmation: "different" }).success).toBe(false);
    expect(passwordChangeSchema.safeParse({ currentPassword: "oldpassword", password: "newpassword", confirmation: "newpassword" }).success).toBe(true);
  });
});