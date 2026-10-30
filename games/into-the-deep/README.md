# Into the Deep — The Search for ROOT’s Cousin

A browser-local Three.js side-scrolling cave adventure starring Stickolas Cage, Donald Stump and ROOT. Static HTML/CSS/JavaScript; Three.js 0.180.0 is vendored in `dist/assets`.

## Play and fixed roles

Serve the website repository root over HTTP, then open `/games/into-the-deep/dist/`. The game reuses the website’s local Satoshi and Inter fonts from `/assets/fonts/`; include those shared assets if deploying the game separately. WASD/arrows move and climb, Space jumps, J attacks, E descends at the cave entrance, 1–6 select available weapons, and P/Escape pauses. On mobile, the thumb joystick and Jump/Attack/Enter controls support multiple fingers; Weapon cycles available gear.

Stickolas always leads and defends. Donald follows, holding an ever-burning torch. There is no explorer switching. Donald is protected while Stickolas takes combat damage; if Stickolas falls, the expedition ends. Exits restore only 15 HP to Stickolas; wounds carry into the next floor.

The torch flickers with a warm glow and a radial halo that fades to complete darkness. The darkness mask covers the cave, enemies, treasure and particles; HUD and explored-room map remain readable. All wall torches are removed. Lighting follows Donald's torch hand in either facing direction. This is radial lighting, without wall-cast shadows or ray tracing.

## Cave and equipment

Each generated maze is a connected spanning tree of horizontal tunnels and vertical ladders. Caves grow early and then slow down, capped at 14 columns and five rows so deeper runs do not become endless walks. The bottom-right room contains a rock archway and stairs into the next level. Exits celebrate and award a depth bonus.

Starting rewards are 25/40/60/100 points for snakes/bats/rats/spiders and 15/150 for common/rare treasure. Enemy rewards scale with depth and hit count; veterans get an additional reward bonus. Treasure values increase with depth. Weapon drops equip automatically: rocks provide 8 rounds, Pea Pod Blasters 15 and sap bombs 3. Bombs damage nearby enemies on impact. Empty weapons return to the unlimited melee spear. Glowing fungi heal Stickolas by 15 HP. Each new floor guarantees ammunition, one healing pickup and a Sunspore along the route to the exit.

## Rendering, mobile and persistence

Canvas2D artwork becomes a Three.js CanvasTexture in an orthographic WebGL scene. Browsers without WebGL display the same canvas directly. The cave fills the dynamic viewport, preserves portrait/landscape aspect ratios and accounts for mobile safe areas. Pointer capture, cancellation and backgrounding release held controls.

Progress saves in this browser's localStorage. Existing saves retain cave progress, loot and inventory. Older saves that were controlling Donald resume with Stickolas defending; if Stickolas was down, his health is converted from Donald's surviving health percentage.

The PWA manifest supplies fullscreen/standalone metadata and regular/maskable icons. Install uses the browser's native prompt when available, otherwise platform instructions. The versioned service worker caches local game assets for offline use after a successful first visit. Authentication routes and sign-in redirects are excluded. Saves remain device/browser-specific. Reopen or reload the game after a service-worker update to use the newest version.

## Verification

- `node --check dist/game.js`
- `node tests/game.test.cjs`
- `node tests/pwa.test.cjs`

Tests exercise 30 connected mazes, movement, pickups, ammo fallback, combat scoring, ladders both ways, healing/progression, portrait/landscape dimensions, multitouch input, torch falloff and tracking, fixed-role defeat behavior, legacy saves, offline shell routing, auth exclusion and old-cache cleanup.

Browser QA checked the torch sprite, warm halo, complete outer darkness and fixed-role HUD with the canvas fallback. The managed browser disables WebGL. Physical-device installation and native multitouch still require checking on target phones.

## Balance pass and Sunspores

Equipment tiers increase every four floors (1–4: Mk 1; 5–8: Mk 2; etc.). The spear upgrades automatically, and weapon pickups match the floor tier. Damage is 1× tier for spear, 2× tier for rocks/darts, and 6× tier for sap bombs. Projectiles retain their damage at launch. Ammo carries forward; a better pickup upgrades that weapon's existing ammunition.

Current-tier spear targets: ordinary enemies 2–4 hits, spiders 5–6, and gold-marked veterans 5–7. Deeper caves favor rats/spiders and sometimes pair enemies. Contact damage and movement scale gently with caps, and Stickolas has 0.65 seconds of contact-damage immunity after a hit to prevent instant damage from overlapping enemies. Enemy points scale by depth and relative toughness, plus a veteran bonus.

Sunspores are golden sun-shaped pickups. They activate immediately, reveal all currently visible cave scenery for 12 gameplay seconds, show Donald's countdown/status bar, and fade back into the normal halo over the last two seconds. Further pickups refresh to 12 seconds. Pausing freezes the countdown; saves preserve the remaining duration. They do not consume or replace the equipped weapon or reveal the whole minimap.

Saves store maze dimensions and equipment tiers. Pre-tuning saves reconstruct their original maze dimensions and connections; remaining enemy health is converted proportionally to the new balance. New floors use the slower cave growth.

The automated checks cover target hit counts and guaranteed route supplies through level 1000, Sunspore pickup/reveal/fade/expiry/pause/refresh, multi-enemy contact immunity, projectile damage snapshots, and old/new save round trips. This is an initial balance pass; sustained human play will guide further tuning.

## Resize handling

When the canvas dimensions change, the game disposes its previous Three.js texture and assigns a new CanvasTexture to the existing screen material. Unchanged canvas sizes reuse their texture, and hidden viewports leave it intact. Resize regression checks cover landscape/portrait transitions, disposal, material updates, matching darkness dimensions and preserved expedition state. The offline cache is versioned so existing installations receive the fix.

Chrome verification on October 29, 2026 covered repeated desktop/portrait/landscape resizing and working attack/pause controls afterward, with no warnings or errors captured.

## Title screen

The title screen uses a centered dark-green layout inspired by the sibling game Sticks in the Woods. Into the Deep is the primary title; The Search for ROOT’s Cousin is the subtitle and story premise. Gameplay HUD stays hidden until beginning or continuing an expedition. The browser title, in-game brand, installation metadata and field guide use the new name. Existing save keys, app identity and URL are retained for compatibility.

## Floating HUD

The cave fills the viewport behind a translucent HUD, matching the presentation of Sticks in the Woods. Depth, score and treasure float in compact panels with pause and utility controls; Stickolas’s single health panel sits beside the top HUD. Donald’s status and the equipped-weapon panel are omitted to keep the cave clear. Phone portrait and landscape layouts retain touch controls and safe-area spacing. Title and pause overlays cover the HUD controls.

The Stickolas health portrait and brand portrait reuse the in-game character drawing, cropped to show each face. They are drawn locally on small canvases; the character names remain accessible text. No additional image downloads are required.

The Pea Pod Blaster uses the sibling game’s green pod artwork and highlighted, round green pea projectiles. Existing `dart` save/inventory keys retain compatibility; ammunition, firing rate, damage and collision rules are unchanged.

## Mobile controls

The left joystick now follows the thumb-drag controls in Sticks in the Woods: slide to reverse without lifting, with proportional horizontal speed, a center dead zone, and a vertical bias to keep ladder climbing aligned. Jump and the larger Attack button sit together on the right; Weapon and Enter sit above them. The layout respects safe areas and moves the HUD above controls on compact landscape screens.

Pause, overlays, backgrounding, rotation, cancellation and lost pointer capture release held controls. Automated regression checks cover joystick reversal, dead zone, climbing, independent fingers and pause cleanup. Chrome previews checked portrait (390×844) and landscape (844×390 and 568×320); physical iOS/Android multitouch and play feel still need a phone check. The offline shell cache version is bumped for installed games.

## Bottom-row HUD clearance

Only Stickolas has a health display, placed at the top. Donald’s status and the equipped-weapon panel have been removed; Sunspore time remains in the objective text. Browser QA used a local test save with both explorers in the lowest tunnel, including a partially depleted health bar, in portrait and landscape. The fixture is outside the repository and does not modify normal saves or gameplay. Automated checks exercise bottom-row camera clearance at 390×844, 320×568, 844×390 and 568×320. Physical-phone verification remains outstanding.

## iPad accidental zoom

The active play surface disables browser touch gestures across the cave and gaps between controls. Non-passive touch, double-click and Safari gesture listeners cancel native zoom during play. Title/pause overlays and open guides retain their normal interactions. Weapon cycling responds on pointer-down, with keyboard/assistive click support, so cancelling native touch clicks does not break it. The offline cache is bumped. Automated tests cover event cancellation, mode/dialog exclusions and single weapon activation; a physical iPad check is still required to confirm native Safari behavior.

## Camera framing

The camera centers horizontally on Stickolas, including at the cave edges. Vertically it centers his body in the clear area measured between the visible HUD and any controls overlapping the explorers’ center lane. Smooth following is constrained so jumps and ladder movement cannot carry his head or feet into those UI regions. Starting, resuming, entering a floor and resizing refresh the framing; the camera may show extra darkness beyond the cave edge.

Automated checks cover all cave rows, both outer horizontal edges, jumps/climbing and sudden transitions across six phone/tablet dimensions. Local Chrome previews cover the top row in portrait and the bottom row in compact landscape and tablet portrait. Native iPad Safari and physical-device play remain separate verification.

## Cave discoveries

New content is introduced gradually, with route supplies on newly generated floors:

| First depth | Discoveries |
| --- | --- |
| 1 | Bark shield: absorbs three contact hits, refills to three on pickup, carries between floors. Guaranteed on depth 1 and every fourth floor afterward, with rare extra drops. Remaining charges appear beside Stickolas’s health. |
| 1 | Beetles warn for 0.55 seconds, charge faster than Stickolas runs, then recover for 1.25 seconds. Their front armor blocks ordinary attacks during windup/charge; jump over, flank, use a bomb, or counterattack for double damage during recovery. |
| 2 | Ricochet seeds provide 12 rounds with three wall/floor rebounds per shot. |
| 3 | Ceiling grubs warn for 0.55 seconds before dropping, then crawl. Amber cave sap spikes damage and halve grounded movement briefly; jump over them. Sticky sap jars provide three traps: Attack places a teal patch that slows enemies for eight gameplay seconds without slowing Stickolas. |
| 3 | One guarded treasure room, preferably in a side passage. Its chest opens only after its two marked guardians and their slime descendants are defeated. Walking up collects three rare treasures, 10 health and 12 seeds. No door blocks travel or the exit. |
| 4 | Slimes split into two weaker, smaller slimes. Children never split again and retain guardian membership. |
| 7 | Two guarded rooms per floor; the count stays capped at two. |

Rare shields, seeds and trap jars also join the random pickup pool after their introduction. Seeds and traps equip on pickup, use the existing Attack control and join the mobile Weapon cycle. Keyboard 5 selects seeds and 6 selects traps. The spear remains unlimited. Enemy toughness stays bounded; new ordinary enemies take at most four current-tier spear hits before beetle recovery bonuses or slime splitting.

Saves include shield charges, seed/trap ammunition and tiers, enemy behavior states, slime descendants, active traps, wild sap and guarded-cache state. Existing saves retain their current cave without new encounters being injected; new discoveries appear on the next generated floor. Placed traps clear on floor changes. Pause freezes trap duration and enemy behavior timers. The versioned offline cache includes the update.

Automated content cases cover introduction gates through depth 1000, shield hit immunity, beetle charge/recovery, grub drops, bounded splitting, seed wall/floor rebounds and launch damage, trap ownership/slowing/expiry, guarded rewards exactly once, optional exits and old/new saves. Chrome QA used local test saves to clear an actual generated guarded room, collect its reward, place traps with keyboard controls and inspect the phone HUD, full shield and ceiling-grub artwork. Test fixtures stay outside the repository. Native iPad/iPhone/Android multitouch and long-session balance remain physical-device/human play checks.

## Challenge tuning

The third balance version makes damage persist across floors. Exits heal 15 HP, fungi heal 15, and guarded caches heal 10. There is one guaranteed healing pickup per route, fewer random healing/shield drops, half as many random weapon drops, and route ammo every fifth room instead of every third. Shields still block three hits but are guaranteed only on depths 1, 5, 9, etc.

Enemies move faster and deal more damage with bounded depth scaling. Beetles appear on depth 1, charge at 330 units/second against Stickolas’s 210 running speed, and deflect frontal ordinary hits during their telegraphed windup/charge. Recovery, flanking, ricochets and bombs remain counters. Spear recovery is 0.42 seconds. Ground-enemy hitboxes match their low silhouettes so jumps reliably clear them; bats and falling grubs remain aerial threats. Amber sap has visible spikes and damages grounded players; friendly teal traps remain harmless to Stickolas. Contact immunity is 0.65 seconds to prevent stacked instant damage.

Old saves receive new enemy damage/speed while preserving remaining-health proportions, small-slime size, guardian links and AI state. Existing floor pickups stay intact; reduced supply generation applies to newly generated floors.

Deterministic gameplay regressions compare the same encounter with and without jumping: 78 vs 100 HP for a charge, 76 vs 100 HP crossing sap. Standing in enemy contact with a full three-hit shield is lethal in approximately 8.2 seconds in the test setup. Tests also cover armor counters, partial exit healing, hazard death ordering and old-save migration. These are software scenarios, not a measured human death rate; longer play sessions will guide further tuning.
