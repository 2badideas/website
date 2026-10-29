# Sticks in the Woods PWA

Serve the website repository root over HTTP and open `/games/sticks-in-the-woods/`. Use HTTPS for deployment; localhost also supports service workers for development.

The title and pause menus offer **Install game**. The outer page handles native installation prompts for the embedded game; browsers without a prompt receive platform instructions. Opening `game.html` directly supports the same installation flow. The manifest has a separate identity and scope from Into the Deep, fullscreen/standalone display modes, and local 180/192/512-pixel icons. Installed apps hide the install buttons.

The service worker precaches the wrapper, game, install UI, manifest and icons. After one successful online visit, either entry page can reload and play without the server. Only these local files are intercepted; other pages, third-party requests and non-GET requests are left alone. Cache cleanup touches only this game's cache prefix. Bump the `CACHE` version in `sw.js` when shipping changed assets, and update the expected version in the test. Reload after the update activates to use the new files.

Runs remain in memory. Installation and offline caching do not save scores or resume a closed run. Clearing this site's browser data removes its cached files. No tracking or external dependencies were added.

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
