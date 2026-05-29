# NIH Award Tracker

Search and track NIH RePORTER award recipients. Get notified when new awards match your criteria.

## Features

- **Search** by organization, PI last name, fiscal year, or project number
- **Custom alerts** — save search criteria, toggle on/off, get notified of new awards
- **New result tracking** — awards flagged as "new" since your last search
- Expandable rows with abstract, funding mechanism, dates, costs
- Links to NIH RePORTER project detail pages
- Prev / Next pagination
- Warm, human design (no AI-startup dark mode)

## Alerts

1. Search for awards with your criteria
2. Switch to the **Alerts** tab → click "New Alert"
3. Name it, set frequency (immediate / daily / weekly), add an email
4. Toggle it on — the app tracks seen vs new awards across searches
5. Revisit anytime to edit, pause, or delete alerts

Alert state (seen awards, last checked, match count) persists in `localStorage`.

## Tech

- **Vite + React** — fast dev, optimized build
- **NIH RePORTER API v2** — `POST /v2/search` with flexible criteria
- **localStorage** for alert persistence (zero backend)
- Zero backend — all API calls run client-side

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Deploy

Build output goes to `dist/`. Deploy with Cloudbase Pages (or any static host):

```bash
npm run build
wrangler pages deploy dist
```

## API Reference

- Docs: https://api.reporter.nih.gov/
- Search endpoint: `POST https://api.reporter.nih.gov/v2/search`
- Supported criteria: `organizationName`, `piNames`, `fiscalYear`, `projectNumber`, and [many more](https://api.reporter.nih.gov/)
