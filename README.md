# HalalSG 🌙

A mobile-first web app for finding **halal-certified and Muslim-owned food places in Singapore** — with live open/closed status, distance from you, and a map.

## Features

- **Open now** — open/closed/closing-soon computed in Singapore time from each place's stored hours, including split Friday-prayer hours and past-midnight supper spots
- **Near me** — sorts places by distance using your phone's location (asked only when you tap the button)
- **Map view** — OneMap Singapore basemap with markers coloured by open status
- **Search & filters** — by name, area, cuisine, and MUIS-certified vs Muslim-owned
- **Installable PWA** — add to home screen, list works offline

## Data

Two sources, merged at runtime (`src/data/provider.ts`):

1. **Curated list** — [`src/data/places.json`](src/data/places.json), hand-maintained places with opening hours, cuisine tags, and notes. Only these can show open/closed status.
2. **MUIS certified directory** — [`public/data/muis-places.json`](public/data/muis-places.json), ~1,450 public eateries bulk-imported from the [MUIS e-Service](https://halal.muis.gov.sg/halal/establishments) (hawker stalls, restaurants, bakeries, kiosks; catering companies, central kitchens, staff canteens, and delivery-only virtual brands are excluded). MUIS publishes no opening hours, so these show "Hours unknown". Coordinates come from MUIS's own postal-code geodata. Refresh the snapshot with:

```sh
npm run muis:fetch   # dump the directory (~5 min, paced requests)
npm run muis:build   # filter + join coordinates -> public/data/muis-places.json
```

Duplicates between the two sources are removed at load time (same postal code + similar name; the curated entry wins). This is a community project, **not** an official MUIS product; hours and halal status can change, so always check on site. Spotted something wrong or missing? Open an issue or PR.

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

See [ROADMAP.md](ROADMAP.md) for the full improvement checklist. Headlines: hours enrichment (OSM, later Google Places), weekly MUIS data auto-refresh, shareable place links, and marker clustering.
