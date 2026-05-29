# NIH Award Tracker

Search and track NIH RePORTER award recipients. A clean Vite + React app that queries the NIH RePORTER API v2.

## Features

- Search by organization name, PI last name, fiscal year, or project number
- Expandable rows with abstract, funding mechanism, dates, costs
- Links to NIH RePORTER project detail pages
- Prev / Next pagination
- Warm, human design (no AI-startup dark mode)

## Tech

- **Vite + React** — fast dev, optimized build
- **NIH RePORTER API v2** — `POST /v2/search` with flexible criteria
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
