---
name: verify
description: Build, run, and drive the HalalSG PWA in a headless browser to verify changes end-to-end.
---

# Verifying HalalSG

## Build & serve

```sh
npm run build          # tsc + vite build (PWA generated)
npm run preview        # serves dist at http://localhost:4173 (run in background)
```

## Drive it

Use `playwright-core` (already a devDependency) against the system Edge browser — no browser download needed:

```js
import { chromium } from 'file:///D:/Projects/HalalSG/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  geolocation: { latitude: 1.30258, longitude: 103.85918 }, // Kampong Glam — makes "Near me" testable
  permissions: ['geolocation'],
});
```

Run drive scripts from outside the project via the absolute `file:///` import above (ESM ignores NODE_PATH).

## Flows worth driving

- List renders 50 `.place-card`s; footer shows "N of 50 places"
- "Open now" chip → no `.badge-closed` remain
- "MUIS certified" chip (use `exact: true` — card text contains badge text!) → no `.badge-owned`
- "Near me" → `.distance` elements appear, list re-sorts nearest-first
- Card click → `.sheet` with 7-row hours table, today highlighted
- Map tab → OneMap tiles + `.map-pin` markers; **markers overlap in Kampong Glam** — filter via search first before clicking a marker, or the click hit-test fails
- Manifest + service worker: check `link[rel=manifest]` fetch and `navigator.serviceWorker.getRegistration()`

## Gotchas

- `getByRole('button', { name: ... })` collides with place cards (cards are buttons containing badge text) — always pass `exact: true` for chip buttons.
- OneMap tiles need ~3–4s to load before a map screenshot.
- Unit tests for the open-now timezone logic: `npm test` (CI runs these; not a substitute for driving the app).
