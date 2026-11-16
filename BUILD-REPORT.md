# Build Report: Astra: Keeper of the Meridian

## Concept and Features

Astra is an original lens-routing defense game. Four autonomous beacon types cover different ranges and roles: steady Sunwells, chaining Prisms, long-range Lances, and slowing Wards. Players place lenses beside a winding road, earn light for kills, upgrade or sell lenses for a refund, and hold ten increasingly varied waves culminating in the Eclipse Heart. It includes pause, speed, mute, persistent best score, synthesized WebAudio, title/win/loss/restart screens, mouse and keyboard controls, and deterministic staged scenes through `?shot=<name>&seed=1`.

## Files

- `game/index.html`: offline page and controls
- `game/css/style.css`: responsive game shell and control styling
- `game/js/game.js`: state, economy, wave scheduling, input and combat
- `game/js/render.js`: canvas field, HUD, effects and screen overlays
- `game/js/sound.js`: synthesized audio feedback
- `main.ts`: deterministic copy-and-dossier entrypoint
- `vendor/makefun-game.ts`: unchanged kit dossier library
- `screenshots/`: four Playwright renders
- `README.md`, `package.json`, `.makefun/owner.json`, `LICENSE`

## Verification

- Kit initialized in the empty repository; anchor: `makefun anchor bab9652f5dd6bdf3c4bb595d8275059b41d1b0b1 round 33989127`.
- Vendor MD5 matches kit source: `2da03e097f2d64ae65e3d1c3586e652a`.
- `node main.ts` succeeded. Two output directories produced byte-identical `dossier.json`; final SHA-256: `f12154a3a54d192ecfcb4d500ec6bbb8bd2ab59be064ff8a7f3c538c1ff6d08f`.
- Playwright (Chromium 1255, 1280x720): title, staged midgame, boss, and win scenes rendered with zero console/page errors. Runtime requests stayed local; no external requests were observed.
- Interaction tests covered valid placement, invalid road placement (no currency change), upgrade, sell-back refund, wave launch/clear and kill payouts, pause, speed, mute, and restart from both win and loss states. A defensive run cleared five waves and retained 19+ lives through wave 5 while adding lenses. The longer ten-wave browser automation exceeded the command runner's 120-second ceiling before completion; the full natural-play win path was therefore not independently completed in automation.
- Screenshot files are ordered alphabetically as `01-start.png`, `02-mid.png`, `03-boss.png`, `04-win.png`; each is PNG, 1280x720, and 57-73 KiB (within the 256 KiB cap). The requested visual inspection tool returned an image-input unsupported error in this environment.
- `node --check` passed for each game JavaScript module and `main.ts`.

## Reviewer Notes

`01-start.png` is the title cover. `04-win.png` is a staged results screen, and `03-boss.png` shows the late encounter. Gameplay and results can be explored without network access by serving `game/` over HTTP.

## Balance Fix

- Tower base damage increased: Sunwell `16 -> 20`, Prism `12 -> 15`, Lance `34 -> 40`, Ward `8 -> 10`.
- Kill reward base increased by 25% (`Math.round(base.reward * 1.25)`, retaining the existing wave bonus).
- Starting light increased `720 -> 800`.
- Non-boss wave size reduced from `7 + 2 * wave` to `6 + 2 * wave`; the Eclipse Heart remains `600 HP`.
- Parent playtest evidence: one strong-defense run with 5 towers lost at wave 4 with lives `20-14-6-2-0`; another with 7 opening towers plus 10 reserve buys (17 total, 2x speed) lost at wave 8 with lives `20,20,20,19,15,12,9,6,0`, while cash reached `1601` unspent after tower slots saturated. These reports motivated the DPS, economy, and enemy-count adjustments above.
- `main.ts` was run twice after the fix; both dossier files were byte-identical. New dossier SHA-256: `1030bc0ee114b093bc26499e10109913899cd73514db415ab5d9f5df41ce34d8`.
- No screenshots were re-rendered. The parent will verify the complete ten-wave win path.
