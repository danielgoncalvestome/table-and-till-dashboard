import { z } from "zod";

export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/);
export function usernameEmail(username: string) {
  return `${usernameSchema.parse(username)}@accounts.menutap.invalid`;
}
export function realAccountEmail(email?: string | null) {
  return email && !email.toLowerCase().endsWith("@accounts.menutap.invalid") ? email : undefined;
}
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  password: z.string().min(8).max(128),
  confirmation: z.string(),
}).refine((v) => v.password === v.confirmation, { path: ["confirmation"] });