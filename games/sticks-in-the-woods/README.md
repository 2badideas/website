# Sticks in the Woods PWA

Serve the website repository root over HTTP and open `/games/sticks-in-the-woods/`. Use HTTPS for deployment; localhost also supports service workers for development.

The title and pause menus offer **Install game**. The outer page handles native installation prompts for the embedded game; browsers without a prompt receive platform instructions. Opening `game.html` directly supports the same installation flow. The manifest has a separate identity and scope from Into the Deep, fullscreen/standalone display modes, and local 180/192/512-pixel icons. Installed apps hide the install buttons.

The service worker precaches the wrapper, game, install UI, manifest and icons. After one successful online visit, either entry page can reload and play without the server. Only these local files are intercepted; other pages, third-party requests and non-GET requests are left alone. Cache cleanup touches only this game's cache prefix. Bump the `CACHE` version in `sw.js` when shipping changed assets, and update the expected version in the test. Reload after the update activates to use the new files.

Runs remain in memory and restart after closing or reloading. The game saves available/lifetime XP, best wave cleared, unlocked abilities, and selected loadout under `sticks-in-the-woods.progress.v1` in localStorage. Saves occur after XP awards and loadout selections, at game over, on page exit, and on initial load. The loader validates saves, migrates the former grapple ability to Bark Wall, and leaves unreadable saves untouched. If storage fails, progress lasts only for the session and the loadout screen explains the failure. Close the game and clear this site's browser data to remove progression and cached files. Saved progression is never transmitted. The shared consent controller retains the owner-approved optional page-visit and game-start analytics from main; see `docs/umami-release.md`.

## Verification

From the repository root:

```sh
node games/sticks-in-the-woods/tests/pwa.test.cjs
node --check games/sticks-in-the-woods/pwa.js
node --check games/sticks-in-the-woods/sw.js
```

Checks cover offline wrapper/game/assets and launch queries, manifest and PNG sizes, rejected redirects/sign-in pages, game cache isolation, iframe origin/source checks, native prompt lifecycle, installed-state propagation, platform instructions and registration failure.

Chrome verification on October 29, 2026 confirmed the game reloaded and began a playable run while the local HTTP server was stopped. The server was restarted after this check. Installation guides worked from the title and pause screens, including phone-sized layout. Native app installation and physical iOS/Android installation have not been completed as part of this verification.

## Icons

`assets/icon.svg` is the editable original, with its artwork inside the maskable safe area. Rebuild the PNGs with librsvg:

```sh
rsvg-convert -w 180 -h 180 games/sticks-in-the-woods/assets/icon.svg -o games/sticks-in-the-woods/assets/icon-180.png
rsvg-convert -w 192 -h 192 games/sticks-in-the-woods/assets/icon.svg -o games/sticks-in-the-woods/assets/icon-192.png
rsvg-convert -w 512 -h 512 games/sticks-in-the-woods/assets/icon.svg -o games/sticks-in-the-woods/assets/icon-512.png
```

## Wildfire replacement review — November 5, 2026

Replaces game.html with the supplied Wildfire file, retaining PWA metadata, title/pause installation controls, and main's consent-gated analytics. The actual run start sends the existing allowlisted event; opening the loadout menu does not. Cache advances from the deployed v2 to v3 and retains the shared local consent controller and response-draining installation fix.

| Finding | Policy promise / evidence | Fix / release impact |
| --- | --- | --- |
| Progression persists on-device | game.html: SAVE_KEY, loadProgress, saveProgress, awardXP, chooseAbility; policy's device-storage section | Policy and install guide disclose XP, best wave, unlocks and loadout. Saves remain local. |
| Optional analytics retained | game.html: startRun; js/analytics.js; policy's optional-analytics section | Consent browser suite passes rejection, acceptance, withdrawal, GPC/DNT, expiry, route/iframe and payload checks. Synthetic collection intercepted. |
| Cached clients need the new game | sw.js v3; tests/analytics-offline.browser.cjs | Actual Edge worker upgrade v2→v3, isolated caches, retained disposable storage, cached consent controls and offline game start pass with no external requests. |

Validation: inline game syntax, PWA script/worker syntax, existing PWA suite, consent browser suite, offline browser suite, and diff checks passed. The browser suites support Windows paths and PLAYWRIGHT_CHANNEL (default chrome; msedge used here). Earlier November 2 desktop and 390×844 touch-layout gameplay/save checks passed for movement, attack, abilities, pause/resume, installation guide, synthetic XP/unlock/loadout persistence, grapple migration, invalid-save preservation, and clearing progression. The earlier offline-readiness timeout is resolved by main's response-draining worker fix and is now covered by the passing browser upgrade/offline suite. Physical-device/native installation checks remain unperformed.

Review status: ready for Jacob's review within this scope; production deployment remains unverified. No related Sticks issue was found in the initial review. Jacob reviews and merges PR #8. Previous source before this update: 10021e4 (main). Roll back through a new PR restoring the prior game and device-storage wording while retaining consent behavior; advance the cache version again and preserve device saves.

## Compact mobile controls — November 5, 2026

Touch layouts show a compact health bar, wave number and one-line weapon name at the top. Movement/combat actions sit above their respective edge sticks. Pickup appears only when an item is in reach; the duplicate mobile pickup prompt is hidden. The aim stick fades to 12% opacity when released and returns to full opacity while held. Releasing stops attacking and retains the last aim direction, including while the movement stick remains held. Desktop HUD and controls are unchanged.

Cache advances from v3 to v4. Storage, save format, dependencies and consent behavior are unchanged. The mobile browser suite passed in Edge at 320×568, 390×844 and 844×390, covering HUD bounds, edge placement, pickup availability/collection/range, simultaneous sticks, retained aim, idle fade and cancellation without game JavaScript errors. Portrait layout was also inspected in a screenshot. The existing PWA suite and actual browser v3→v4 upgrade/offline-start suite passed. Physical-device checks remain unperformed.

Run `node games/sticks-in-the-woods/tests/mobile.browser.cjs` with Playwright on NODE_PATH. Set PLAYWRIGHT_CHANNEL=msedge to use Edge; default is chrome. MOBILE_SCREENSHOT optionally saves the portrait check image.

## Ash & Amber silent ending draft — November 5, 2026

The user selected storyboard A (Ash & Amber) after rejecting the first procedural art and sound draft. The revised animatic uses three painted frames: weary close-up, standing wasteland reveal and a matching seated pose. Camera drift, a slow pullback and dissolves establish the pacing. This is a silent animated storyboard for review, with no synthesized breathing or music. The existing stats page, credit, stats values and return-to-title flow are retained.

Clearing wave 100 awards normal XP once, saves progression and starts the ending; there is no wave 101. The image fade starts after four seconds of black. The pullback starts at 12s, the seated pose dissolves in at 32s, then a hard cut to black at 37s. Stats fade in after a two-second hold; Return to title appears at 44s. Time excludes paused gameplay and upgrade menus. Skip remains available while artwork loads or if loading fails. Reduced-motion mode removes zoom/drift. Hidden tabs pause the timeline. Phones retain the full landscape scene with letterboxing.

The local assets are ending.js/css and assets/ending/ash-close.webp, ash-wide.webp and ash-sit.webp (about 1 MB combined). Asset-generation prompts and provenance are in assets/ending/ARTWORK.md. Cache v4 (current main) → v6 includes all three images. No runtime remote media, dependencies, new storage keys or telemetry events are added. Existing save format and consent behavior are unchanged; the ending's stats stay in memory. Site-data deletion works as documented in privacy.html.

| Review | Evidence | Result |
| --- | --- | --- |
| Local-only artwork and stats | ending.js Image URLs and canvas; game.html beginEnding | Same-origin static image requests; no audio creation, collection or persistence. |
| Completion and saves | ending.browser.cjs wave 99/100 scenarios | Ending begins only after clearing 100; final XP is awarded once; best wave saves. |
| Controls and fallbacks | Loading/error skip, reduced-motion, visibility listener | Browser checks cover desktop/mobile, reduced motion, no audio API and missing artwork. |
| Offline delivery | sw.js v6; PWA and actual upgrade browser suites | Painted assets cached, unrelated caches and disposable storage preserved. |

Validation: ending browser suite, existing PWA suite, syntax checks, and diff checks passed in Edge. Close-up, wide, seated and stats frames inspected on desktop/mobile. The actual cache-upgrade/offline suite covers v4→v6 and each painted asset. This is ready for visual review; physical devices and production deployment remain unverified.

Run node games/sticks-in-the-woods/tests/ending.browser.cjs with Playwright on NODE_PATH and optional PLAYWRIGHT_CHANNEL=msedge; ENDING_SCREENSHOTS saves key frames. Screenshots and the standalone preview use synthetic stats. Current main before this draft is 3a58c73. Roll back through a PR restoring the prior wave-clear flow and advancing the cache version; preserve progression saves. Jacob reviews and merges draft PR #11.
