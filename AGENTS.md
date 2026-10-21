# Agent instructions

## Explicit approval before merging

- You may edit files, create branches, commit, push branches and open or update pull requests within the user's requested scope.
- Never merge a pull request without the user's explicit approval for that specific PR. Approval to implement a change, open a PR, run checks or finish a task is not approval to merge.
- Passing checks, an approved review, or an existing auto-merge setting do not replace explicit user approval in the conversation.
- Do not enable auto-merge, use a merge queue, push task changes directly to a protected branch, or use another account, API, CLI or automation to bypass this rule.
- If approval is absent, finish the implementation and checks, leave the PR open and report its status. Do not call a merge tool to trigger an approval prompt.
- Treat a cancelled or rejected merge action as no approval; do not retry through another route.

## GitHub access controls

These instructions are a behavioral rule, not a technical access boundary. Do not claim that merging is technically blocked until repository rules and the integration identity have been verified.

For technical enforcement, use a dedicated integration identity separate from the user's GitHub account. It may write feature branches and open PRs, but must not be able to update `main`, bypass its rules, administer repository access or approve on the user's behalf. GitHub write access alone does not distinguish branch pushes from merges; enforce the restriction with branch rules that permit only the human maintainer to update `main` while requiring PRs and checks. Keep the integration outside every bypass list. Check that a human merge is permitted and an integration merge is denied before describing enforcement as active.

Do not change credentials, disconnect the user's account, grant permissions, add bypasses or weaken branch rules as a workaround. Report missing administration access and the remaining configuration steps.
