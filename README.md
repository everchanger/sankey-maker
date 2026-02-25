# Sankey Maker

A simple, modern Single Page App built with Vue 3 that converts CSV data into interactive Sankey diagrams.

## Features

- **CSV Upload** — drag & drop or click to upload any CSV file
- **Column Wizard** — choose which columns to use as source, target, and value
- **Sankey Diagram** — auto-generated, interactive diagram powered by D3
- **Export** — download the chart as SVG or PNG, or export the raw Sankey JSON data

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The built files are placed in `dist/` and deployed automatically to GitHub Pages on every push to `main`.

## Deployment

The app is deployed to [GitHub Pages](https://everchanger.github.io/sankey-maker/) via a GitHub Actions workflow (`.github/workflows/deploy.yml`).
