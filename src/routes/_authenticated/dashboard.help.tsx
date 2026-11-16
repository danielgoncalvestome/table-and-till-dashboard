import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/help")({
  beforeLoad: () => { throw redirect({ to: "/dashboard/manage", search: { s: "help", checkout: undefined }, replace: true }); },
});
