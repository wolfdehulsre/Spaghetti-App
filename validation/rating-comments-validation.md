# Rating comments validation — 2026-10-20

Implemented optional comments in Dutch, French and English on the home form, personal cards and group overview. Comments use plain text, preserve internal newlines and use the existing rating permissions. Longer comments expand with an accessible button; empty comments add no block.

- `npm ci --ignore-scripts`, placeholder-config build and JavaScript syntax checks passed.
- `node --test --test-reporter=spec tests/*.test.mjs`: 65 passed.
- `node validation/rating-comments.browser.cjs`: passed in headless Chromium, at 390px mobile and 1280px desktop widths. Requires Playwright and Chromium; dependencies were provided by the execution environment. Uses disposable fixtures, never real accounts or ratings.
- Browser checks: three-language labels, validation and expansion; unchanged user text during language switches; create/edit/clear; counter reset; 500/501 emoji code points; failed persistence preserves the draft; safe HTML-like text; long unbroken text causes no horizontal overflow. Screenshots are retained alongside this report.
- Applied `20261020173133_rating_comments.sql` to the configured Supabase project. Confirmed nullable column, length constraint, invoker trigger and retained RLS. Probed the actual deployed constraint/trigger using a temporary table in a rolled-back transaction: 500 emoji accepted, 501 rejected, whitespace becomes NULL and internal newlines survive trimming. No member data was changed by validation.
- Added a repeatable pgTAP regression file. The complete local Supabase/Docker suite was not run because Docker is unavailable.
- Supabase security advisor reported no findings on the changed objects. Existing unrelated findings: policy-free private invite-attempt table (intentional restricted access) and disabled leaked-password protection ([Supabase guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).

The limit counts Unicode code points consistently with PostgreSQL `char_length`, not UTF-16 units. Complex emoji sequences can contain multiple code points. Client input exceeding 500 is visibly flagged and cannot be saved; pasted text is never silently truncated. Both frontend and trigger normalize line endings and trim surrounding whitespace. Empty values are stored as NULL.

The Supabase CLI could not start because it attempted to create a configuration directory on the read-only home filesystem. The migration was therefore created through the Supabase connector and retained locally under the exact version returned by the migration history.
