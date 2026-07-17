# HalalSG 🌙

A mobile-first web app for finding **halal-certified and Muslim-owned food places in Singapore** — with live open/closed status, distance from you, and a map.

## Features

- **Open now** — open/closed/closing-soon computed in Singapore time from each place's stored hours, including split Friday-prayer hours and past-midnight supper spots
- **Near me** — sorts places by distance using your phone's location (asked only when you tap the button)
- **Map view** — OneMap Singapore basemap with markers coloured by open status
- **Search & filters** — by name, area, cuisine, and MUIS-certified vs Muslim-owned
- **Installable PWA** — add to home screen, list works offline

## Data

The dataset lives in [`src/data/places.json`](src/data/places.json) — a curated, community-maintained list. It is **not** an official MUIS source; hours and halal status can change, so always check on site. Spotted something wrong or missing? Open an issue or PR.

### Adding a place

Add an entry to `places.json` (leave `lat`/`lng` as `0`), then run:

```sh
npm run geocode   # fills coordinates via the free OneMap search API
```

Hours format: `"daily"` is the default, day keys (`mon`–`sun`) override it, `null` means closed, and multiple ranges per day are supported (e.g. Friday `[["07:00","12:30"],["14:00","20:00"]]`). A closing time earlier than the opening time (e.g. `["18:00","02:00"]`) runs past midnight.

## Development

```sh
npm install
npm run dev       # local dev server
npm test          # unit tests (open-now logic)
npm run build     # production build
```

## Deployment

Pushing to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`. One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**. Also update `REPO_URL` in [`src/config.ts`](src/config.ts).

## Roadmap

- Live data via Google Places API behind the existing `PlacesProvider` interface (`src/data/provider.ts`)
- Ad slots (`src/components/AdSlot.tsx` is the reserved integration point)
- Full MUIS-certified directory import
