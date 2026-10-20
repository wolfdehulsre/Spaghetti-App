# Beste Belgische Bolognaise

A small static HTML/CSS/JavaScript PWA. Supabase Auth and Postgres provide shared group data; Leaflet remains the map. Ratings are private to signed-in members of the configured group through database RLS.

## Local setup

1. Create a Supabase project and copy `.env.example` to `.env`. Fill `SUPABASE_URL` and the browser-safe publishable/anon key. Do not put a service-role key in this file.
2. Install Node.js 20+ and the Supabase CLI. Link the project and apply migrations: `supabase link --project-ref YOUR_REF`, then `supabase db push`.
3. In Supabase Auth, disable public sign-ups. Invite your own email in the dashboard and activate the account. In the SQL Editor, create the group and owner membership using the SQL below. Copy the returned group UUID into `.env` as `GROUP_ID`.
4. Add a Geoapify key if you want place search (restrict it by web origin), then run `npm run build` and `npm run dev`; open `http://localhost:8765/`.

## First owner and group

Disable public sign-ups in Supabase Auth. Invite your own email once from the Supabase dashboard, activate the invite, and copy that Auth user's UUID. In the SQL editor create the group and its first owner membership:

```sql
insert into public.groups(name) values ('Beste Belgische Bolognaise') returning id;
insert into public.group_members(group_id,user_id,role,display_name)
values ('PASTE_GROUP_UUID','PASTE_AUTH_USER_UUID','owner','Your name');
```

Put the returned group UUID in `.env` as `GROUP_ID`, then run `npm run build`. The frontend uses only the publishable/anon key; RLS is mandatory. Never place `SUPABASE_SERVICE_ROLE_KEY` in `.env` or generated browser configuration.

## Invite friends

Set Supabase Auth Site URL and allowed redirect URLs to your local URL and production HTTPS origin. Set Edge Function secrets in the Supabase dashboard/CLI: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_ORIGIN` (exact app origin, no trailing slash). Deploy `invite-member` with `supabase functions deploy invite-member`. Signed-in owners can then invite a friend by email in the app. The function verifies the caller's owner role, sends the Auth invitation, and creates a member role; clients cannot write roles. The service-role key stays in Supabase Edge Function secrets.

## Optional local Supabase with Docker Desktop

Docker Desktop is **optional** and is only needed when running a local Supabase stack for development or database/RLS testing. It is **not** needed to run the production app: Cloudflare hosts the frontend and the hosted Supabase project provides Auth, Postgres, and Edge Functions. Your computer and Docker Desktop can be switched off while the production app remains online.

GitHub Actions runs the RLS tests using disposable Supabase containers on GitHub-hosted runners; these do **not** require Docker Desktop on your own computer. Keep the Supabase CLI, migrations, RLS tests, and CI workflow even if you do not use Docker locally.

To use an isolated local Supabase environment, install and start Docker Desktop, then from this project folder run `npm install` and `npx supabase start`. Apply the checked-in migrations with `npx supabase db reset`, set the local Supabase URL and public anon key shown by the CLI in your private `.env`, then run `npm run build` and `npm run dev`. Stop the local containers with `npx supabase stop`. Do not paste CLI output containing keys into GitHub.

For frontend-only development against the hosted Supabase project, Docker is not needed: configure the browser-safe hosted Supabase URL and anon key, then run `npm run build` and `npm run dev`. Be careful: this setup can access or change real hosted data. Never use production service-role keys in the browser or commit credentials.

The hosted-project workflow (`supabase link` followed by `supabase db push`) targets the linked remote database. Use it only when intentionally applying migrations to that hosted project; Docker Desktop is for the optional local stack.

## Production hosting and Android

Use static hosting with HTTPS (for example a static site host that supports build-time environment variables). Build command: `npm run build`; publish directory: project root. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROUP_ID`, and optional `GEOAPIFY_API_KEY` as host build variables. Set Supabase Auth Site URL/redirect allow-list and Edge Function `APP_ORIGIN` to the production origin, then restrict browser keys to that origin. Deploy the Supabase migrations and Edge Function before inviting users.

Open the production HTTPS URL in Chrome on Android, sign in, open Chrome's menu, and choose **Install app** or **Add to Home screen**. The service worker caches only same-origin app shell assets; Supabase, map tiles, and ratings are never cached, so offline mode does not present stale shared data.

## Tests

Run `supabase test db` for the pgTAP RLS checks in `supabase/tests/rls.test.sql`. Before production, also run the app-level checklist in this README manually with two invited accounts: auth/session restore, restaurant and pin creation, rating create/edit/reload, cross-member visibility, non-member denial, role tampering denial, network failure/retry, narrow mobile layout, and Chrome Android installation. API keys and a hosted Supabase project are needed for those end-to-end checks.


## Manage members

Owners can open **Manage members** from the header dropdown to visit `/members`. The page shows account activation status, adds new or existing accounts to the group, and can resend invitations for accounts awaiting activation. New members choose their own password from the invitation email. Repeating an invitation does not duplicate memberships or change existing passwords, names, or owner roles. The logo and back link return to the home page.

Run `node --test tests/invite-member.test.mjs` for invite retry, membership recovery, role checks, rate limiting and directory isolation tests. After changing the function, deploy both `index.ts` and `handler.mjs` as the `invite-member` Edge Function with JWT verification enabled. No schema migration is needed for this fix.

## Rating photos

Each rating can have one optional photo. JPEG/PNG/WebP inputs are limited to
10,000,000 bytes, decoded with orientation, resized to at most 1,200 pixels on the
longest side without enlargement, and re-encoded as JPEG (stripping source EXIF,
including GPS). The target is at most 200,000 bytes; 300,000 bytes is the hard
stored limit. Only this version is uploaded. Originals are never stored.

Photos are private to active members of the rating's group. Only the creator can
change the photo; existing owner permissions still allow deletion of the entire
rating. Signed read links expire after five minutes; previously issued links can
remain valid during that window after membership changes. The service worker
never caches Storage responses. Images are loaded on approach to the viewport,
with a five-minute browser cache and a new immutable path for each replacement.

Deployment order (no paid plan or image transformation service is required):

1. Apply the committed `rating_photos` migration using the existing Supabase
   migration workflow. It creates the private `rating-photos` bucket, limits,
   ownership-checked RPC, and RLS policies. Deploy the database before the UI.
2. Deploy `supabase/functions/cleanup-rating-photos`. Keep JWT verification on.
   Set a randomly generated `PHOTO_CLEANUP_SECRET` in the function's secrets.
3. In Supabase Vault, create `photo_project_url` (the project's HTTPS URL),
   `photo_anon_key` (its **legacy JWT anon key**, not an `sb_publishable_` key),
   and `photo_cleanup_secret` (the same random value as the function secret).
   Keep the secret out of source control and browser configuration.
4. Run `supabase/ops/schedule-photo-cleanup.sql` in the SQL editor as postgres.
   It installs a job every 15 minutes, using Vault rather than embedding secrets
   in the cron command. Monitor Cron job runs and the function's HTTP status.
5. Deploy the static app and test upload, replacement and removal with a member
   account. Check Storage usage in the organization's Usage dashboard.

A reservation allows only one in-flight upload per rating for 15 minutes. Failed
uploads preserve the saved rating and the previous photo. Save retries target the
same rating; the original submission key also handles a lost insert response.
Deleting a rating (including a restaurant/group cascade) queues its files in the
same database transaction. Cleanup expires abandoned reservations after an hour,
waits at least an hour after queueing a file, deletes through the **Storage API**,
and acknowledges only successful deletion. Errors leave the queue for the next
run. Cleanup must be deployed and scheduled: without it, unused files continue to
consume storage. At most 100 files are removed per invocation; monitor the queue
if deletion volume exceeds 400 per hour. Never delete `storage.objects` rows with
SQL to remove actual files.

The 1 GB Free storage allowance is cumulative and shared with other assets.
At 150 KB per photo, 1,000 photographed ratings use roughly 150 MB. Downloads
consume cached or uncached egress; use the Usage dashboard to track both budgets.
Set an operational alert before reaching 80% of either quota. There is no
automatic subscription upgrade or purchase in this feature.

Validation: `node --test tests/*.test.mjs`, `npm run build`, and
`npm run test:rls` against the disposable local Supabase stack. The photo database
tests cover creator-only writes, shared reads, outsiders/deactivated members,
reservation conflicts, missing uploads, replacement failure, expiry and cascading
cleanup. `validation/rating-photos.browser.cjs` runs browser compression, preview,
failed-upload retry without duplicate ratings, dialog, removal and cancellation
checks using mocked backend calls and a real browser image encoder. Install
Playwright outside the repository or use `NODE_PATH` to an existing installation.
