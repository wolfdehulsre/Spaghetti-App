# Branch and pull request workflow

Use this sequence for changes:

1. Update `main`, then create a descriptive branch: `git switch main`, `git pull --ff-only`, `git switch -c feature/short-description` (or `fix/` or `chore/`).
2. Make a focused change and review `git diff` so unrelated local work stays out of the change.
3. Run `npm ci`, `npm run build` with local placeholder/public configuration as appropriate, and the relevant syntax or database checks. Do not use production credentials for tests.
4. Stage only intended files, commit with a clear message, and push the branch: `git push -u origin <branch>`.
5. Open a pull request targeting `main`. Fill in all four template sections: `Opgeleverd` (what changes and why), `Validatie` (checks and results, or why tests were skipped), `Beperkingen` (known limitations, or `Geen`), and `Deployment` (rollout steps and current deployment state, or `Niet van toepassing`). Keep descriptions current after rollout; a merged PR alone does not prove that every component is live.
6. Wait for the required `validate` check (and any other enabled checks) to pass. Review the diff, then merge the pull request.

Do not push task changes directly to `main`. Keep `.env`, `runtime-config.js`, Supabase service-role keys, database passwords, and other credentials out of commits. The RLS CI job starts a disposable local Supabase stack and uses only fixtures from `supabase/tests/rls.test.sql`.

Useful local commands:

```sh
npm ci
SUPABASE_URL=https://example.supabase.co SUPABASE_ANON_KEY=ci-placeholder GROUP_ID=00000000-0000-4000-8000-000000000000 npm run build
node --check app.js
node --check pwa.js
node --check service-worker.js
node --check build-config.js
node --check serve.js
supabase start -x realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
npm run test:rls
```

The local Supabase commands require Docker. `npm run build` generates the ignored `runtime-config.js`; use only harmless public placeholder values for CI-style validation.

## Required PR documentation

The `pr-documentation` check runs when a PR is opened, edited, updated, reopened or marked ready for review. It rejects missing/empty sections, template comments and common placeholders. Short, concrete descriptions are sufficient for small changes. Reviewers still verify accuracy; automation checks structure, not whether claims are true.

To enforce this check, configure an active GitHub branch ruleset for `main` under Settings → Rules → Rulesets (or extend existing branch protection). Require a pull request and require the status check `pr-documentation` from GitHub Actions, preserving existing required checks such as `validate` and `rls`. Require branches to be up to date, block force pushes and deletion, and keep bypass access empty or limited to explicitly approved emergency access. Do not require another reviewer for a single-maintainer repository. Run the new workflow on a PR before selecting its check in GitHub's settings.

The workflow and template alone do not block merging: the required-check rule must be enabled in repository settings by an administrator. Protect changes to this workflow through review if contributors have permission to modify it. Existing PRs must fill in the sections when updated; historical PRs are not rewritten automatically.
