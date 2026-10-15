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

## Local Supabase with Docker Desktop

For the local Supabase stack, install and start Docker Desktop first. From this project folder, run npm install, then npx supabase start. The Supabase CLI runs the local database and services in Docker containers. Apply the checked-in migrations to the local database with npx supabase db reset, then set the local Supabase URL and public anon key shown by the CLI in .env. Keep .env private; do not paste CLI output containing keys into GitHub. Finish with npm run build and npm run dev. Stop the local containers with npx supabase stop.

The hosted-project workflow (supabase link followed by supabase db push) targets the linked remote database. Use it only when intentionally applying migrations to that hosted project; Docker Desktop is for the local stack.
## Production hosting and Android

Use static hosting with HTTPS (for example a static site host that supports build-time environment variables). Build command: `npm run build`; publish directory: project root. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GROUP_ID`, and optional `GEOAPIFY_API_KEY` as host build variables. Set Supabase Auth Site URL/redirect allow-list and Edge Function `APP_ORIGIN` to the production origin, then restrict browser keys to that origin. Deploy the Supabase migrations and Edge Function before inviting users.

Open the production HTTPS URL in Chrome on Android, sign in, open Chrome's menu, and choose **Install app** or **Add to Home screen**. The service worker caches only same-origin app shell assets; Supabase, map tiles, and ratings are never cached, so offline mode does not present stale shared data.

## Tests

Run `supabase test db` for the pgTAP RLS checks in `supabase/tests/rls.test.sql`. Before production, also run the app-level checklist in this README manually with two invited accounts: auth/session restore, restaurant and pin creation, rating create/edit/reload, cross-member visibility, non-member denial, role tampering denial, network failure/retry, narrow mobile layout, and Chrome Android installation. API keys and a hosted Supabase project are needed for those end-to-end checks.

