---
name: website-privacy-review
description: Review this website and its browser games against privacy.html before release or when data handling, storage, external services, assets, or dependencies change. Report evidence and fixes for Jacob without expanding the requested implementation scope.
---

# Website privacy review

Read root `AGENTS.md` and `privacy.html`. Review the actual release diff and reachable files, including standalone games, workers, imported libraries, and CSS. Use the current policy rather than assuming this snapshot is still accurate.

## Inspect data flow

- Identify automatic requests from scripts, stylesheets, fonts, images, media, embeds, preconnects, workers, and dynamically generated URLs. Inspect `fetch`, XHR, beacon, WebSocket, EventSource, form submission, tracking SDKs, and imports. Search results are leads, not a complete audit; inspect vendored dependencies when they can initiate requests.
- Distinguish same-origin asset delivery, local-only game state, visitor-initiated external navigation, and transmitted player data. A same-origin analytics endpoint is still tracking. Hosting security logs are distinct from gameplay analytics.
- Inventory cookies, local/session storage, IndexedDB, Cache Storage, service workers, and saved-file import/export. Record what persists, whether it leaves the device, and how it is removed. Check that the policy accurately covers each game.
- Do not introduce remote analytics or error-reporting services as a way to validate privacy. Avoid real player data in fixtures, screenshots, reports, and logs.

## Verify in the browser

Use a clean browser profile or isolated context with synthetic progress. Observe network requests on first load, game start, play, saving, pause, restart, and reload. Include the outer page and embedded game. Inspect request destinations, initiators, and payloads without clicking unrelated outbound links.

Check both first-load and service-worker-controlled behavior. Test local save persistence and clearing site data with disposable saves. If browser inspection is unavailable, explicitly label the result as source-only and runtime behavior as unverified.

## Report

Return a short table of finding, policy promise, file/line evidence, recommended fix, and release impact. Separate confirmed mismatches from unresolved questions. Conclude with ready, not ready, or incomplete for the reviewed scope; this is a policy-alignment review, not a legal-compliance certification.

Prepare requested fixes only within the authorized scope. Otherwise hand concrete implementation findings to Jacob. Do not send him a message unless asked. Do not rewrite the policy to make an accidental dependency or telemetry feature acceptable.

## Starting findings — October 30, 2026

Reverify these; they are a handoff snapshot, not a permanent allowlist.

The Sap & Survive font and storage-disclosure findings are tracked in [GitHub Issue #2](https://github.com/2badideas/website/issues/2). Check its current status before reporting or filing them again.

- At commit `f2a3b574123d4495a484657992c55afed4063b42`, `games/sap-and-survive/index.html:4–6` preconnects to Google Fonts and loads a Google-hosted stylesheet. The same tags were confirmed in the public route's HTML. This conflicts with the policy's statement that fonts are served locally. Jacob should use local licensed font files or existing local/system fonts and verify no automatic Google font requests remain.
- Sap & Survive uses localStorage for character selection and save slots (`hf-char`, `readSlot`, `writeSlot`). The policy describes the other two games' storage but does not explain this game's saves. Jacob should verify the actual data flow and add accurate coverage before the next release.
- The initial source scan found no visitor-analytics integration in first-party runtime files. It was not an exhaustive dependency or browser network audit; do not treat it as a clean release sign-off.
