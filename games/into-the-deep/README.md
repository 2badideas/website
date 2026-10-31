# Into the Deep — The Search for ROOT’s Cousin

A 32-floor browser-local cave adventure starring Stickolas Cage, Donald Stump, and ROOT. Static HTML/CSS/JavaScript with locally vendored Three.js and fonts.

## Play

Serve the website root and open `/games/into-the-deep/dist/`. WASD/arrows move and climb, Space jumps, J attacks, E uses the exit or reunites with the cousin, 1–6 select available weapons, and P/Escape pauses. Space also starts, resumes, continues, and activates the end-screen action. Mobile has a joystick and Jump/Attack/Enter/Weapon controls.

Stickolas has 100 HP and fights; Donald follows with the torch and is protected. Exits heal 15 HP, fungi heal 15, and optional guarded caches heal 10. Wounds and ammunition carry forward. Bark shields block three hits. Sunspores illuminate the screen for 12 gameplay seconds, fading during the final two seconds. Pause freezes gameplay effects.

## Campaign schedule

The authoritative unlock tables and individual floor messages are `MOB_UNLOCK`, `ITEM_UNLOCK`, and `FLOOR_NOTES` in `dist/game.js`.

| Level | Arrival or encounter focus |
| --- | --- |
| 1 | Snakes, spear, common treasure, fungi; short introductory cave |
| 2 | Bats and throwing rocks |
| 3 | Sunspores |
| 4 | Rats and Pea Pod Blaster |
| 5 | Spear Mk 2; familiar mixed encounters |
| 6 | Rare amber relics in optional branches |
| 7 | Longer caves with route healing |
| 8 | Spiders and bark shields |
| 9 | Spear Mk 3; small groups |
| 10 | Ricochet seeds |
| 11 | Seed ammunition and optional exploration |
| 12 | Ceiling grubs |
| 13 | Spear Mk 4; overhead and ground threats |
| 14 | Wild sap spikes, with a clear introduction |
| 15 | One optional guarded cache |
| 16 | Splitting slimes and sticky trap jars |
| 17 | Spear Mk 5 |
| 18 | Veteran snakes, bats, and rats |
| 19 | Two optional guarded caches |
| 20 | Veteran spiders and grubs |
| 21 | Spear Mk 6; reduced ordinary population |
| 22 | Sap bombs |
| 23 | Extra bomb supplies at guarded rooms |
| 24 | Armored charging beetles; full roster unlocked |
| 25 | Spear Mk 7; mixed beetle encounters |
| 26 | Veteran slimes |
| 27 | Veteran beetles in optional guarded rooms |
| 28 | Veteran beetles enter normal encounters; recovery stops |
| 29 | Spear Mk 8; glowing mycelium trail |
| 30 | Guaranteed route healing, shield, bombs, blaster ammo, seeds, Sunspore |
| 31 | Three staged veteran pairs: beetle/rat, grub/slime, beetle/spider |
| 32 | Short peaceful approach, open mushroom chamber, E/Enter to reunite and win |

Normal HP is 2–4 current-tier spear hits, or 5–6 for spiders; veterans take 5–7. From level 3, a 35% spawn variation can add one tier-scaled HP point within these caps. Spears and new weapon pickups gain a tier every four floors. Carried weapons upgrade when a stronger pickup is collected. Damage: spear 1× tier, rocks/blaster/seeds 2×, bombs 6×; jars slow enemies without damage.

Enemy damage rises 9% of base per four-floor chapter (up to 63%), speed rises 4.5% per chapter (capped at 30%), and veterans deal another 20% damage. Beetle charge speed is fixed. Random encounter probability rises from 35% to 70% by chapter; additional weak enemies join from level 9. Caves reach at most 14 columns by five rows in the final third; level 32 returns to six by three. Wild sap damage increases by chapter from 10 to at most 18 during this campaign. The last floor has no enemies or sap hazards.

Beetles warn before charging, block frontal attacks during windup/charge, and take double damage while recovering. Bombs bypass their frontal armor. Grubs warn then drop from ceilings. Slimes split once into two faster minions with 35% of the parent’s max HP and half its damage. All cache guardians, including minions, must be defeated to unlock the reward: three rare relics, 10 HP, and 12 seeds. Caches are outside the required route.

## Saves, privacy, and offline play

The existing `stick-below-v1` localStorage key holds progress, inventory, cave dimensions, enemies, effects, and completion. It never leaves the device. Existing saves retain their current floor layout, inventory, and wounds; enemy stats migrate proportionally. Subsequent floors use the campaign schedule. Old endless saves at or above level 32 relocate to the peaceful reunion floor while preserving equipment and health. Completed saves reopen the victory screen without awarding the finish bonus again. New expedition replaces the save after confirmation; clearing site data removes saves and caches.

The service worker caches local game assets for offline play, with its own `stick-together-shell-` cache prefix. Runtime dependencies and fonts stay local. No analytics or gameplay telemetry is added.

## Checks

Run from this directory:

```sh
node --check dist/game.js
node tests/game.test.cjs
node tests/pwa.test.cjs
```

The VM suite checks all 32 floor gates, connected mazes, combat counters, movement, camera layouts, saves, completion, and legacy migration. The worker suite checks asset precaching, offline retrieval, cache cleanup, and route isolation. These do not establish physical-device performance or complete-campaign balance; those require playtesting.
