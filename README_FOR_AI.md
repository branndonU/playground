# Project briefing for automated assistant

This document is a concise, actionable briefing so another automated assistant (or tool) can quickly understand, run, debug, and modify the Sankey chart in this repository.

Repo root (paths are relative):
- `index.html` — Vite entry HTML
- `package.json` — scripts and dependencies
- `vite.config.js` — Vite + React plugin
- `Data/` — example CSV data (contains `sankey_first_year.csv`)
- `src/` — React source files
  - `src/SankeyChart.jsx` — the Sankey component (primary file of interest)
  - `src/App.jsx` — demo app which mounts `SankeyChart`
  - `src/main.jsx` — React entry
  - `src/index.css`, `src/App.css` — styles

Quick commands (PowerShell):
```powershell
cd 'c:\Users\brand\Documents\GitHub\playground'
npm install
npm run dev
```

Open the dev server URL printed by Vite (usually `http://localhost:5173`).

--------------------------
Sankey component summary (`src/SankeyChart.jsx`)
--------------------------

Purpose
- Reads a CSV, builds a sankey layout using `d3` + `d3-sankey`, and renders an interactive SVG Sankey with hover tooltips and a legend.

Key behaviors
- CSV loading: `d3.csv(csvPath)` is used to load rows.
- Column mapping is configurable via props: `sourceKey`, `targetKey`, `valueKey`.
- Missing or invalid source/target names are remapped to a single `Unknown` node (this prevents d3-sankey errors such as `missing: 0`).
- Links with non-positive numeric values are dropped.
- Hovering links/nodes shows a tooltip with a small stat (value and percent of total).
- A compact legend is rendered to the right of the chart; it shows left-side nodes (sources) and their color swatches.

Important functions and flow
- buildSankeyData(rows)
  - Normalizes source and target to trimmed strings.
  - Builds a `nodes` list and `links` list (links use source/target names, not numeric indices).
  - Ensures an `'Unknown'` node exists and remaps missing names to it.
  - Drops links with non-positive `value`.
  - Returns `{ nodes: [{name}], links: [{ source: 'X', target: 'Y', value: N }] }`.

- In the effect where the CSV is read:
  - `raw` rows are created using the configured keys: `{ Crime_type: d[sourceKey], outcome_summary: d[targetKey], index: +d[valueKey] }`.
  - `buildSankeyData(raw)` is called.
  - `sankey()` is configured with `.nodeId(d => String(d.name))`, `nodeWidth`, `nodePadding`, and `extent`, then invoked with the nodes/links.
  - Hover handlers are attached to link paths and node groups to display tooltips.

Props (component API)
- csvPath: string — path or URL to the CSV file. Default: `/Data/sankey_first_year.csv`.
- sourceKey: string — header name for the source column (default: `Crime_type`).
- targetKey: string — header name for the target column (default: `outcome_summary`).
- valueKey: string — header name for the numeric value (default: `index`).
- width: number — SVG width (default: `1000`).
- height: number — SVG height (default: `600`).

CSV expectations and example
- CSV must be browser-accessible (place under `public/` in a Vite project or serve via static server). Vite serves files in the project `public/` directory at `/`.
- Basic expected headers (defaults): `Crime_type`, `outcome_summary`, `index`.
- Example (CSV rows):

```
Crime_type,outcome_summary,index
Burglary,No suspect identified,251383
Shoplifting,Resolved,15250
...other rows...
```

If your CSV uses different header names, pass `sourceKey`, `targetKey`, and `valueKey` accordingly.

Errors and diagnostics
- If the sankey code cannot find node ids referenced by links, d3-sankey throws `Error: missing: <id>` (e.g. `missing: 0`). To diagnose:
  - Look in the browser console for these logs emitted by the component:
    - `Sankey graph nodes: N` and `Sankey graph links: M` (counts)
    - `buildSankeyData: remapped X links to 'Unknown' or dropped due to non-positive value` and a `Sample problematic rows (up to 5)` listing raw row objects; this reveals which CSV rows had problems.
- The component also logs `Error loading sankey CSV or building graph:` with the stack if CSV parsing or layout fails.

Integration notes for another assistant
- To adapt the component to a different codebase:
  1. Copy `src/SankeyChart.jsx` into the target project.
  2. Ensure `d3` and `d3-sankey` are installed (the repo uses versions compatible with D3 v7):
     - `d3@^7.0.0` and `d3-sankey` (recent versions in package.json)
  3. Import and mount the component and pass props if headers differ.
  4. Make sure CSV files are served from a location accessible by the browser.

Customization and extension points
- Responsive sizing: `width`/`height` are fixed. For responsive behavior, replace the fixed width with container bounding box measurement and recompute layout on resize.
- Tooltip positioning: currently uses `event.offsetX/Y`. To support page-level layouts, switch to `event.pageX/pageY` and compute offsets relative to container.
- Legend generation: currently takes nodes on the left half of the produced layout as sources. If the data needs a canonical legend order, compute legend items from the original source list instead.
- Aggregation: to combine small flows into an `Other` bucket, perform a pre-aggregation step in `buildSankeyData` (group by source/target and sum values; then optionally collapse entries below a threshold into `Other`).

Unit tests and checks
- No tests are shipped. If the assistant is permitted to add tests, add a small Jest test that exercises `buildSankeyData` with a handful of synthetic rows and asserts node/link counts and the presence of `Unknown` when inputs are missing.

Deliverables the assistant can produce quickly
- A small wrapper to load a given CSV path and print the first 20 parsed rows.
- A responsive version of the Sankey component (resizes with window/container).
- Tooltip improvements (clamping to viewport or flipping logic).

If you (the downstream assistant) want an exact, minimal patch to copy/port `SankeyChart.jsx` into another repository, tell me the target project's file layout and I will produce a minimal single-file patch that preserves the component and its dependencies.

---
End of briefing
