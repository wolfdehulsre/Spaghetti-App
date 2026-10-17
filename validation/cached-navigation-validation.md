# Cached navigation regression — 2026-10-17

Production `/members.html` responds with HTTP 308 to `/members`; `/members` responds with HTTP 200. The old worker installed a followed redirect response in its shell cache under `/members.html`. Returning that cached response for browser navigation caused ERR_FAILED.

Fix: use `/members` in the account menu and login return route; serve the same canonical route locally; include canonical and legacy routes in cache v20; reconstruct followed redirect responses with the original body, status and headers before caching or returning them. Cache scope still excludes configuration, authentication and API responses.

Validation:

- Five new serviceworker tests cover cached redirect responses, canonical navigation from cache, redirected network fallback/cache misses, old cache cleanup, and exclusion of authentication/API/external/non-GET traffic.
- Before the fix, three of those tests failed. After the fix, all five pass; the 12 existing invitation tests also pass.
- An isolated browser fixture used actual HTTP 308 responses and the original v19 worker. Opening the cached legacy members link reproduced ERR_FAILED. The browser tool could not operate its internal error page; testing resumed in a new tab at the fixture home page.
- Updating that same origin to the corrected v20 worker fixed the legacy link. Opening and reloading `/members.html`, opening and reloading `/members`, and opening cached `/index.html` all displayed their expected pages.
- The browser fixture used no production accounts or data. Temporary fixture files were removed after use.
- Build with harmless placeholder configuration, syntax checks and diff checks passed. Existing runtime configuration was restored.

This repairs navigation only; it does not add offline authentication or offline rating storage. No physical Android device was available; the repeated-navigation regression was reproduced and retested in the in-app browser.
