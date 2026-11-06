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

## HTML/SVG ending draft — November 6, 2026

The user requested an ending built directly in HTML, without generated images, and a character who does not look sad. The scene is now an editable inline SVG built by ending-scene.js: layered burnt landscape, charred trees, ash, six fallen-creature designs and a segmented stump character. The character has level brows, a neutral breathing mouth and steady gaze. The camera continuously changes the same SVG viewBox from face close-up to wide reveal. Body/arms/legs animate into a seated pose; the pose keeps his face upright. All raster art and its generation notes are removed from runtime inputs. The standalone preview is self-contained HTML (about 19 KB).

The draft remains silent. Wave-100 completion, final XP award, best-wave save, stats, Made by 2badIdeas credit, skip and return-to-title flow are unchanged. Black 0–4s; fade to close-up; pullback starts at 12s; sitting starts at 32s; cut to black at 37s; stats fade at 39s; Return to title at 44s. Hidden tabs pause the timeline. Reduced motion disables the camera zoom, breathing and ash drift. Phones retain the whole scene with letterboxing.

| Review | Evidence | Result |
| --- | --- | --- |
| Code-built scene, local-only stats | ending-scene.js SVG paths/symbols/gradients; ending.js DOM | No raster images, media, network APIs, new storage or telemetry. |
| Neutral expression and animation | Level brow paths; data-expression=steady; live viewBox/limb transforms | Browser checks verify the same vector scene pulls back and the legs bend while expression stays steady. |
| Completion and persistence | Ending browser suite wave 99/100 checks | Ending begins only after clearing 100; final XP awards once, best wave saves and a new run resets elapsed time. |
| Offline delivery | sw.js v7; PWA/browser upgrade suites | Current main v4 upgrades to v7, includes ending-scene.js, removes prior image assets, isolates caches and preserves disposable storage. |

No dependency, save format, analytics or privacy-policy changes. Existing scores/inputs/progress remain on-device and the current consent controller is retained. Runtime fonts/assets remain local except the separately consented tracker. Clearing site data removes cached scene code and local progression as documented in privacy.html.

Validation: JavaScript syntax, PWA suite and ending browser suite passed in Edge for desktop, portrait phone, landscape phone and reduced-motion/no-audio cases. Tests cover the no-raster requirement, level brows, continuous camera, seated pose, wave-clear guard, idempotent reward, exact stats, background pause, skip and return/new run. Desktop close-up/wide/seated and mobile layouts were visually inspected. Actual browser v4→v7 upgrade/offline checks pass for all ending code/styles and preserved storage. Physical devices, Safari and production remain unverified.

Run node games/sticks-in-the-woods/tests/ending.browser.cjs with Playwright on NODE_PATH and optional PLAYWRIGHT_CHANNEL=msedge. ENDING_SCREENSHOTS saves synthetic check frames. Previous main: 3a58c73. Roll back through a PR restoring the prior wave-clear flow and advancing the worker version; preserve saves. Jacob reviews and merges draft PR #11.
