# Rating photos validation

- `npm ci` and build with harmless public placeholder configuration succeeded.
- All 88 Node tests passed, including cleanup authorization, deletion retry,
  image input validation, aspect ratio, escaping, and existing app regressions.
- Chromium mobile fixture passed real canvas compression (2400×1800 input to
  1200×900 JPEG under 300,000 bytes), preview, failed upload and retry preserving
  the same rating/comment, private image rendering, keyboard dismissal of the
  larger photo, photo removal, malformed input, and cancelling a prepared photo.
- A mobile screenshot is retained as `rating-photos-mobile.png`.
- Backend calls in the browser fixture are mocked. Database policies and cleanup
  state transitions are separately covered by `supabase/tests/rating_photos.test.sql`.
- Local Supabase startup was attempted but its Postgres image could not register
  a Docker layer (`no space left on device`). No production database was used for
  tests. The repository's RLS CI job executes the database suite on a disposable
  Supabase stack.

Deployment requires applying the migration, deploying the cleanup function,
configuring the matching secret in Edge Function secrets and Vault, and running
`supabase/ops/schedule-photo-cleanup.sql` before releasing the frontend. See README.
