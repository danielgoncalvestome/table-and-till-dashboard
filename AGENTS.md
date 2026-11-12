<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Data access is client-side Supabase with RLS (is_member/is_owner helpers); public menu reads rely on anon SELECT policies gated by `published`. Why: one permission model for dashboard and public menus.
- Username identities use a unique normalized profiles field and synthetic auth emails; username login resolves the current email only server-side and returns a session only after password verification. Why: preserve username login after email association without exposing account emails.
- Account credentials are managed in a reusable dashboard settings form, separately from restaurant contact details; synthetic emails never reach the payment provider. Why: account identity and billing must not use placeholder contact addresses.
- Menu images go to the private `menu-images` bucket (public buckets are blocked) and are stored as 10-year signed URLs. Why: public menus need anonymous image access.
- UI strings live in src/lib/i18n.tsx (pt default, en); restaurant content translations live in `*_i18n` jsonb columns. Why: keep interface and menu translations separate.
- Payments use Paddle via the gateway utility in paddle.server.ts, overlay checkout with customData.userId, and a signature-verified public webhook; account_subscriptions stores environment-scoped billing and plans live in billing-rules PLANS. Why: Merchant of Record handles tax, and test payments must never grant live access.
- Public menu access is checked by restaurant_billing_access through RLS, while members retain draft and expired-menu read access. Why: enforce expiry without deleting restaurant content.
- No physical goods anywhere: plans differ by tier name (Base, Pro, Business, Enterprise) and number of compatible devices (4, 6, 9, 16); never say devices are supplied, offered, shipped or sold. Why: Paddle rejects products that include physical goods.
- Admin-only privileged actions (trial end, owner account info) go through has_role-checked SECURITY DEFINER RPCs; alert rules live in src/lib/admin-alerts-rules.ts. Why: trial fields are trigger-protected and auth.users is not client-readable.
