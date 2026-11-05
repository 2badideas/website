# Optional Umami analytics — release review

Prepared November 4, 2026 against `origin/main` at `a62b4e1972131762da6baf1ae55996cd4d06ec39`. The owner requested Umami and a consent banner and supplied website ID `5ff42a68-829e-4902-9d3b-b4fc38c8f29c`; the owner confirmed the free tier. Jacob reviews and merges. This branch has not been deployed. No existing Umami issue was found; no new issue was requested.

## Behavior and privacy review

| Finding | Evidence | Release effect |
| --- | --- | --- |
| Explicit opt-in before external requests | `js/analytics.js:28`, `:36`, `:53`; browser tests inspect all six HTML routes | Initial load, reject, reject/reload, GPC/DNT, expiry, and preview hosts keep analytics off. |
| Minimal analytics payload | `js/analytics.js:36`; start hooks in `game.js:312`, Woods `game.html:230`, Sap `index.html:1993` | Page path/title, referrer origin, screen/language and allowlisted game name. No query/hash, scores, inputs, saves, custom visitor IDs, performance, errors, replay, or heatmaps. |
| Withdrawal without interrupting a game | `js/analytics.js:36` and the consent controls/storage listener below it | Choices synchronize across same-origin tabs; consent controls do not reload games or clear their saves. Requests already in flight cannot be recalled. |
| Cookie and storage coverage | `privacy.html:32` and `js/analytics.js:12` | No analytics cookie. Local choice expires after 180 days. Blocked storage uses a page-only choice; the current Umami SDK may itself fail closed with blocked storage. |
| Cloud processing accurately described | `privacy.html:31` and `:48` link to Umami metrics, DPA, privacy notice, and pricing | IP/browser processing and rotating identifiers are disclosed; repeat visits are approximate. Owner-confirmed free Hobby tier has six months of analytics retention. Operational logs are separate. |
| Offline cache compatibility | Woods `sw.js:2` v1 → v2; Into the Deep `sw.js:1` v23 → v24 | Both workers cache the shared local consent controller. The remote tracker is never cached and there is no offline analytics queue. Save formats are unchanged. |

Source alignment and the consent browser checks are ready for Jacob's review; this is not legal certification or production verification. The policy and repository instructions change together because tracking is an explicit owner-requested change, not an accidental dependency exception.

References checked November 4, 2026: [tracker configuration](https://docs.umami.is/docs/tracker-configuration), [tracker functions](https://docs.umami.is/docs/tracker-functions), [metric definitions](https://docs.umami.is/docs/metric-definitions), [Cloud retention](https://umami.is/pricing), [DPA](https://umami.is/dpa).

## Validation

- JavaScript syntax checks, both games' existing PWA suites, and Into the Deep's gameplay/save compatibility suite pass. Sap & Survive and Woods inline JavaScript also pass syntax checks.
- `tests/analytics.browser.cjs` runs the actual downloaded Umami tracker with every collection request intercepted. All six routes pass no-request rejection/reload checks; opt-in pageviews, payload minimization, allowlisted starts, all three real game-start flows, no duplicate iframe pageviews, cross-tab withdrawal, GPC/DNT, expired/invalid consent, blocked storage, preview exclusion, mobile sizing, and keyboard Escape/focus restoration pass. No synthetic analytics reached Umami.
- `tests/analytics-offline.browser.cjs` verifies actual Chrome worker upgrades from old cache versions, cache isolation, cached consent controls, preserved disposable storage, and offline launch/start in both games with no external requests. Both workers now drain downloaded response bodies before holding responses for caching; otherwise Chrome can exhaust outstanding-fetch slots during installation. The baseline fixture uses the same response-draining step to seed the old versions with unchanged main-branch assets; the upgraded workers run their actual checkout code.
- Physical phones, installed native apps, Safari, and the production dashboard are unverified.

To run the browser checks, install Playwright outside the checkout and use an available Chrome installation:

```sh
npm install --prefix /tmp/website-analytics-qa playwright
NODE_PATH=/tmp/website-analytics-qa/node_modules node tests/analytics.browser.cjs
NODE_PATH=/tmp/website-analytics-qa/node_modules node tests/analytics-offline.browser.cjs
```

The consent suite downloads only the tracker script; collection is intercepted. Set `UMAMI_SCRIPT_PATH` to a previously downloaded script to avoid this download. The offline suite serves main-branch assets and this checkout over loopback, applies the response-draining fixture noted above only to the old installer, exercises real service-worker upgrades, and uses only disposable browser storage.

## Release and rollback

GitHub Pages was verified to publish `main` at `/` to `https://2badideas.com/`. `main` is unprotected and reports no effective branch rules. These are repository settings, not enforced by these instructions; they were not changed.

After Jacob merges, verify the exact Pages deployment, policy and script bytes, all direct game routes, existing cached clients, and a consented visit/game-start in the correct Umami dashboard. Confirm rejection makes no Umami requests. A merge alone is not deployment evidence.

Rollback through a revert PR; bump both worker versions again so cached clients receive reverted HTML/game files. Preserve player storage. Previous known-good source is `a62b4e1972131762da6baf1ae55996cd4d06ec39`.
