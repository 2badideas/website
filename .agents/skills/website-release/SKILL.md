---
name: website-release
description: Prepare, verify, publish, or roll back this static GitHub Pages website, coordinating Jacob's release ownership, privacy review, game checks, and PWA cache updates. Preparation alone does not authorize deployment.
---

# Website release

Read root `AGENTS.md`. Jacob owns website/game implementation and release decisions. Match the request: preparation produces a reviewable change and release notes; publishing or rollback requires an explicit instruction authorizing that production action. Honor authorization already given for the specific release.

## Verify the target

Inspect `git status`, branch, remote, and the intended diff; fetch remote references without overwriting local work. Check live Pages configuration and relevant branch rules using available GitHub tools or the CLI. If unavailable, report the unknowns before any publishing action.

Snapshot verified October 30, 2026:

- Repository remote: `2Bad-Ideas/website` (the API resolves it to `2badideas/website`). Inspect `origin` again before use.
- Pages publishes the repository root `/` on `main`, using branch publishing (`build_type: legacy`). Domain: `https://2badideas.com/`; `CNAME` contains `2badideas.com`; HTTPS is enforced.
- `main` reported `protected: false`; the effective branch-rules endpoint returned an empty list. No checked-in `.github` workflow was present. Pushing to `main` can therefore publish without this review process being enforced.
- The static files are the deployment inputs; there is no root package/build command. Do not invent an npm build or change hosting as part of ordinary release preparation.

Recommended workflow: working branch → local checks and privacy review → pull request → Jacob's review/merge → Pages deployment verification. Required PRs/checks and appropriate branch protection are a separate configuration task for Jacob; this skill does not configure them or claim they already exist.

## Prepare and verify

1. Identify changed routes and shared assets. Read and follow [the privacy-review skill](../website-privacy-review/SKILL.md). Recheck its known findings; do not claim the release is privacy-ready while confirmed conflicts remain unresolved.
2. Run relevant existing checks from the repository root. For a release affecting multiple games or shared runtime files, run all applicable suites:

   ```sh
   node --check js/main.js
   node --check games/into-the-deep/dist/game.js
   node --check games/into-the-deep/dist/pwa.js
   node --check games/into-the-deep/dist/sw.js
   (cd games/into-the-deep && node tests/game.test.cjs && node tests/pwa.test.cjs)
   node --check games/sticks-in-the-woods/pwa.js
   node --check games/sticks-in-the-woods/sw.js
   node games/sticks-in-the-woods/tests/pwa.test.cjs
   git diff --check
   ```

   Sap & Survive has no checked-in automated suite in the snapshot. Check its inline JavaScript syntax and exercise it in the browser when affected; do not imply another game's tests cover it. Documentation-only changes need skill validation and link/diff review rather than game testing.
3. Serve locally with `python3 -m http.server 8000 --bind 127.0.0.1`. Check the homepage, privacy link, and changed game routes in desktop and mobile layouts. Check controls and console errors relevant to the diff. Record unavailable browser/device checks explicitly.
4. For changed cached assets, update the affected worker's cache version and corresponding test expectation. Check both a clean load and an existing worker upgrading; preserve cache-prefix isolation and saved-game compatibility. For rollback, use a new cache version so installed clients can receive the reverted assets. Never clear real player saves as a deployment step.
5. Prepare a concise release record: reviewed commit/diff, related GitHub Issues, changed routes, test results, privacy findings, cache changes, remaining checks, previous known-good commit, and rollback plan. Use [the issues skill](../website-issues/SKILL.md) for requested issue updates. Stage only intended files. Prepare a PR when requested; do not push directly to the publishing branch as a shortcut.

## When publishing is authorized

Confirm the reviewed diff still matches the release and rerun affected checks if it changed. Jacob's authorized merge/push to the verified source triggers publishing. Observe the Pages build/deployment result for the exact commit; a successful push is not proof of a successful deployment.

Check the public homepage, privacy page, changed routes/assets, console, and network behavior. Check fresh and previously cached clients for affected PWAs. Record the deployed commit and URL; report partial verification accurately. If a check fails, stop further promotion and prepare a targeted fix or rollback.

For an authorized rollback, revert the intended release commits in a new commit/PR, preserving intervening work. Refresh PWA cache versions, run affected checks, and follow the same publication verification. Do not force-push or reset shared history.

GitHub reference: [Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). Recheck provider behavior when changing deployment configuration.
