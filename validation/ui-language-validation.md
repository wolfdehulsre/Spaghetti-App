# UI language validation — 2026-10-17

Tested the current files in `D:\Spaghetti App` using the in-app browser and a disposable local fixture server at `127.0.0.1:8773`. Authentication and rating persistence were simulated in browser session storage. No production credentials, accounts, or database rows were used.

| Check | Result |
| --- | --- |
| Signed-in account dropdown, NL/EN language selector | Passed |
| Sign-out moves selector to the signed-out header menu | Passed |
| Signing in restores the selector in the account menu | Passed with simulated authentication |
| Rating cards, scores, extra tags, counts, show more/less | Passed |
| User data matching translation keys (`Sauce`, `Enough cheese`, `Hot sauce`) | Names, addresses, authors and account name remained unchanged |
| Switching language while editing | Restaurant, address, date and selected scores preserved |
| Save an edited rating | Passed with simulated persistence; translated success message |
| Save a new rating and reload | Passed with simulated persistence; count increased to 5, values preserved |
| Show on map and popup content | Passed; original names and addresses preserved |
| Mobile width 320, NL and EN | Passed after fixes; document content width 305 equals available width 305 with scrollbar |
| Mobile width 375, NL and EN | Passed after fixes; document content width 360 equals available width 360 with scrollbar |
| Mobile dropdown | Within available viewport at both widths |
| Mobile score touch targets | Five buttons remain 44 pixels wide |
| Serviceworker update available, NL and EN | Actual browser worker installation produced translated banners |
| Apply update | Actual controller change reloaded app, retained language, removed update banner |
| Final cache version v18 | Update installed and application loaded |
| Origin unavailable (HTTP 503), then reload | Cached UI and translations loaded; full app initialization failed because runtime-config.js is deliberately excluded from the shell cache |
| Restore origin and reload | App returned with language preference intact |
| Browser errors/warnings after final rating test | None recorded |
| JavaScript syntax | i18n.js, app.js, pwa.js, service-worker.js, serve.js, build-config.js passed |
| Build | Passed with harmless placeholder configuration; existing runtime configuration restored |
| Diff whitespace | Passed |

Fixes made during validation: translated map zoom controls, marker alt text and popup labels; translated title/alt attributes; corrected narrow mobile grid sizing and rating-row wrapping without reducing 44-pixel score buttons. Cache version increased to v18.

## Limits and failed check

Full offline startup does **not** pass. The cached interface remains translated, but runtime-config.js is not cached and initialization stops with the configuration message. Production also depends on externally loaded scripts and live Supabase data. This test simulated an unavailable origin, not a device-wide airplane-mode connection loss.

These browser UI checks do not validate real Supabase authentication, RLS or database writes. Docker's server information request returned HTTP 500, so no disposable real Supabase stack was available for this run. No physical Android device, installed PWA, or mobile operating-system date picker was tested. Browser-native controls follow the browser/OS language. Upstream technical errors and external content may remain English.

The temporary fixture server and scripts were removed after validation. Production backend and serviceworker behavior were not weakened to make these tests pass.
