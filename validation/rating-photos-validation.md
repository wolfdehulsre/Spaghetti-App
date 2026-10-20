# Rating photos validation

- `npm ci` and build with harmless public placeholder configuration succeeded.
- All 88 Node tests passed, including cleanup authorization, deletion retry,
  image input validation, aspect ratio, escaping, and existing app regressions.
- Chromium mobile fixture passed real canvas compression (2400×1800 input to
  1200×900 JPEG under 300,000 bytes), preview, failed upload and retry preserving
  the same rating/comment, private image rendering, keyboard dismissal of the
  larger photo, photo removal, malformed input, and cancelling a prepared photo.
- A JPEG with EXIF orientation 6 was rotated correctly to 600×1200; the
  re-encoded output contained no EXIF block. Group overview photo rendering and
  its larger view also passed.
- A mobile screenshot is retained as `rating-photos-mobile.png`.
- Backend calls in the browser fixture are mocked. Database policies and cleanup
  state transitions are separately covered by `supabase/tests/rating_photos.test.sql`.
- Local Supabase startup was attempted but its Postgres image could not register
  a Docker layer (`no space left on device`). No production database was used for
  tests. The repository's RLS CI job executes the database suite on a disposable
  Supabase stack.

Deployment requires applying the migration, deploying the cleanup function,
configuring the token in Vault (checked by a service-role-only boolean RPC), and running
`supabase/ops/schedule-photo-cleanup.sql` before releasing the frontend. See README.


## Backend rollout — 2026-10-20

Deployed to the app's configured project `nqvjcqitzaxteuvkdnks`:

- All three photo migrations applied; migration history matches committed file versions.
- Private `rating-photos` bucket: 300,000-byte limit, JPEG/WebP only.
- `cleanup-rating-photos` Edge Function active with gateway JWT verification.
- Token generated inside Vault without returning its plaintext. The worker checks
  it through a service-role-only RPC; no manual Edge secret synchronization.
- `pg_cron` and `pg_net` enabled. The active `cleanup-rating-photos` job runs every
  15 minutes and obtains its URL, gateway key and token from Vault at runtime.
- Manual invocation of the scheduled command returned HTTP 200, `{"removed":0}`.
- The same endpoint rejected an incorrect cleanup token with HTTP 401.
- Ordinary members cannot invoke cleanup or token verification RPCs.
- No member ratings or photos were created or changed during rollout checks.

Security advisor found no photo-related findings. The existing invite-attempts
policy notice and disabled leaked-password protection are unrelated to this change.
The frontend PR remains separate from this backend rollout.
