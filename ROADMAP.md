# HalalSG — Improvement Checklist

Ranked by impact within each section. Items marked 🔥 are the recommended next three.

## Data

- [ ] 🔥 **Enrich opening hours from OpenStreetMap** — free Overpass API query for SG halal eateries with `opening_hours`; expected to cover 10–20% of imported places. Raises "Open now" coverage beyond the 50 curated entries.
- [ ] 🔥 **Weekly MUIS auto-refresh** — GitHub Action on a cron schedule that runs `npm run muis:fetch && npm run muis:build` and commits the diff. Keeps certificates current with zero manual effort.
- [ ] **Verify curated hours** — human pass over `src/data/places.json`; entries were seeded best-effort and are unverified. Start with the places you know personally.
- [ ] **Community submissions** — GitHub issue template ("Suggest a place" form) so non-technical people can contribute Muslim-owned places without editing JSON.
- [ ] **Google Places API integration** — near-100% hours coverage plus photos and ratings. Needs a Google Cloud account with billing enabled (10K free Essentials calls/month). Build-time cache behind the existing `PlacesProvider` interface (`src/data/provider.ts`).
- [ ] **Stronger dedupe** — current curated-vs-MUIS matching is postal + name-prefix; add tests and fuzzier matching to catch differently-spelled duplicates.

## UX

- [ ] 🔥 **Shareable place links** — hash routing (`#/place/<id>`) so a place can be sent to a friend and opened directly.
- [ ] **Map marker clustering** — Kampong Glam is an overlapping blob; cluster at low zoom.
- [ ] **"Has hours" map toggle** — let the ~1,450 gray "unknown" pins be hidden so the useful colored pins stand out.
- [ ] **Favorites** — bookmark star persisted to localStorage; the feature that makes people install the PWA.
- [ ] **Fuzzy search** — typo tolerance and word-order-independent matching ("briani", "rice chicken").
- [ ] **Area filter** — filter chip or dropdown by neighbourhood, complementing text search.
- [ ] **Sort options** — A–Z / recently certified / distance, instead of distance-or-alphabetical only.

## Technical

- [ ] **Lazy-load the map view** — Leaflet is the biggest chunk of the ~373 KB bundle and loads even for list-only visitors; dynamic `import()` would cut initial JS by roughly a third.
- [ ] **Privacy-friendly analytics** — GoatCounter or Plausible (free) to learn whether anyone uses the app before investing more.
- [ ] **Bump GitHub Actions versions** — clear the Node 20 deprecation warnings in `.github/workflows/deploy.yml`.
- [ ] **Cache MUIS logos locally** — the 27 real logos are hotlinked from halal.muis.gov.sg; download into the repo at import time.
- [ ] **Tests for provider/dedupe logic** — only `openNow` has unit tests today.

## Growth / monetization

- [ ] **Custom domain** — ~$12/year; effectively a prerequisite for AdSense approval (github.io subdomains are unreliable for it) and makes the app brandable. GitHub Pages supports custom domains free.
- [ ] **AdSense** — apply once the domain is set up and there's some traffic; `src/components/AdSlot.tsx` is the reserved integration point.
- [ ] **SEO / pre-rendered place pages** — the SPA has no per-place URLs for search engines; pre-rendering popular places would bring organic traffic.
