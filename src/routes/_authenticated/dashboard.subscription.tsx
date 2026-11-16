import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({
  validateSearch: (search: Record<string, unknown>) => ({ checkout: search.checkout === "success" ? "success" as const : undefined }),
  beforeLoad: ({ search }) => { throw redirect({ to: "/dashboard/manage", search: { s: "subscription", checkout: search.checkout }, replace: true }); },
});
