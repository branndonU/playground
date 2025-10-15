# Playground React (Vite)

Minimal Vite + React template created in workspace root.

Quick start (PowerShell):

```powershell
npm install
npm run dev
```

This will start the Vite dev server and open a local dev URL.

Files created:
- `package.json` - project scripts and deps
- `vite.config.js` - Vite config with React plugin
- `index.html` - app entry
- `src/` - React source (App.jsx, main.jsx, styles)

If you want TypeScript, routing, or additional features, tell me and I'll add them.

Usage with a different CSV format
--------------------------------

If your CSV uses different column names, `SankeyChart` accepts props to map them. Example:

```jsx
import SankeyChart from './src/SankeyChart'

// If your CSV columns are 'from', 'to', 'count'
<SankeyChart csvPath={'/path/to/file.csv'} sourceKey={'from'} targetKey={'to'} valueKey={'count'} />
```

The component will read the headers you pass and build the Sankey accordingly.
