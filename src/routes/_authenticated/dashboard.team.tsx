import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/team")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/manage", search: { s: "team", checkout: undefined }, replace: true }); },
});
