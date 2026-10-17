# Member invitations validation — 2026-10-17

The reported failure was confirmed in production logs: `duplicate key value violates unique constraint group_members_pkey`. The affected account already existed in Auth and already had the correct member role in the configured group, but had not yet activated its account. No replacement account or password was created.

Changes: a separate `/members.html` page with shared home-page styling and NL/EN copy, owner-only member directory and activation status, explicit resend action, links from the account menu and logo, conflict-safe member insertion, existing-account recovery, and preservation of the invitation activation flow before the SDK consumes the URL fragment.

Validation performed:

- 12 automated backend tests passed: new invite, duplicate retry, existing confirmed account, pending account recovery/resend, owner-role and name preservation, insertion-failure recovery, email-failure recovery, member denial, cross-group denial, expired/missing auth, invalid input/CORS, rate limit, and member directory isolation (some cases are combined).
- Deno typecheck passed with pinned Supabase SDK 2.118.0.
- A production no-op conflict-safe insertion returned zero inserted rows and confirmed the existing expected membership. It did not alter the existing account or membership.
- Browser checks used disposable local accounts and an API fixture: adding, repeating, resending, visible error and enabled retry button after a simulated email failure, member access denial, signed-out login redirect, home/logo navigation, main-page menu navigation, and activation-screen display after the SDK consumes the invite hash all passed.
- NL/EN switching preserved member names that match translation keys.
- At 375 pixels and 320 pixels, document width equaled available width: no horizontal overflow.
- Build with harmless placeholder config and JavaScript syntax checks passed; original ignored runtime config was restored.

Limitations: simulated browser tests did not send real emails or set a real password. Email delivery, following a recipient's invitation link and signing in with their chosen password require the recipient. Existing RLS policies, JWT verification and owner authorization remain in place. Full offline startup is outside this fix.
