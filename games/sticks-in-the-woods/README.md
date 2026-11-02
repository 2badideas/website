# Sticks in the Woods PWA

Serve the website repository root over HTTP and open `/games/sticks-in-the-woods/`. Use HTTPS for deployment; localhost also supports service workers for development.

The title and pause menus offer **Install game**. The outer page handles native installation prompts for the embedded game; browsers without a prompt receive platform instructions. Opening `game.html` directly supports the same installation flow. The manifest has a separate identity and scope from Into the Deep, fullscreen/standalone display modes, and local 180/192/512-pixel icons. Installed apps hide the install buttons.

The service worker precaches the wrapper, game, install UI, manifest and icons. After one successful online visit, either entry page can reload and play without the server. Only these local files are intercepted; other pages, third-party requests and non-GET requests are left alone. Cache cleanup touches only this game's cache prefix. Bump the `CACHE` version in `sw.js` when shipping changed assets, and update the expected version in the test. Reload after the update activates to use the new files.

Runs remain in memory and restart after closing or reloading. The game saves available/lifetime XP, best wave cleared, unlocked abilities, and selected loadout under `sticks-in-the-woods.progress.v1` in localStorage. Saves occur after XP awards and loadout selections, at game over, on page exit, and on initial load. The loader validates saves, migrates the former grapple ability to Bark Wall, and leaves unreadable saves untouched. If storage fails, progress lasts only for the session and the loadout screen explains the failure. Close the game and clear this site's browser data to remove progression and cached files. No tracking, remote transmission, or external dependencies were added.

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

## Wildfire replacement review — November 2, 2026

Replaces `game.html` with the supplied Wildfire file while retaining local PWA metadata and title/pause install buttons. The existing wrapper and homepage route stay in place. Cache version advances from v1 to v2; the previous game had no persistent saves to migrate. Synthetic progression also verified the supplied loader's grapple-to-wall migration.

| Finding | Policy promise / evidence | Fix / release impact |
| --- | --- | --- |
| New progression persists on-device | `game.html`, `SAVE_KEY`, `loadProgress`, `saveProgress`, `awardXP`, `chooseAbility`; privacy promises local-only progress | Updated `privacy.html` and install guide; no collection or transmission added. |
| No remote requests or telemetry found | Source review of game and local PWA files; isolated Edge online play observed only localhost requests | No dependency changes required. Offline browser observation remains incomplete. |

Validation: inline game syntax, PWA script/worker syntax, existing PWA suite, and diff checks passed. Headless Edge desktop and 390×844 touch-layout checks passed for starting, movement, attack, abilities, pause/resume, and installation guide. Synthetic XP/unlock/loadout persistence, grapple migration, invalid-save preservation, and clearing progression passed. No game JavaScript errors or external requests were observed. Browser service workers were disabled for those successful gameplay/save checks after the separate v1-to-v2 service-worker readiness check timed out. Automated offline/cache-isolation checks passed; actual browser offline play and worker upgrade remain unverified. No physical-device or native installation checks were performed.

Review status: **incomplete** pending browser offline/upgrade verification. No related Sticks issue was found; the prior Sap & Survive privacy issue #2 is closed and unrelated. Pages currently publishes `/` on `main`; main has no protection or effective branch rules. This change does not modify hosting or protections. Jacob reviews and merges the PR. Previous known-good commit: `a62b4e1972131762da6baf1ae55996cd4d06ec39`. To roll back, restore the prior game/disclosures in a new PR and advance the worker to a fresh cache version; preserve any device saves.
