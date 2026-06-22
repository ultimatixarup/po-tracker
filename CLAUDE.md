# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A pure-frontend React + Vite web app for tracking Purchase Orders (POs) and projects. There is no backend, no database, and no authentication — all data lives in React state and is lost on page refresh. The initial data is seeded from `/public/data.json`.

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Production build → /dist
npm run preview   # Serve the production build locally
```

There are no test, lint, or type-check scripts configured.

## Architecture

The entire application is two source files:

- **`src/index.jsx`** — monolithic `GridExample` component (~585 lines). Contains the AG Grid setup, all column definitions, the modal "Add New" form, clipboard parsing logic, and the `createRoot` bootstrap call.
- **`src/useFetchJson.jsx`** — simple custom hook: `fetch(url)` → JSON → `{ data, loading }`.

### Data flow

1. On mount, `useFetchJson("/data.json")` loads 4 seed rows into `rows` state.
2. The AG Grid renders `rows` directly; all columns are editable by default.
3. "Add New" opens a fixed-position modal. The user fills the form or pastes clipboard data.
4. "Paste from Clipboard" calls `navigator.clipboard.readText()`, runs it through `parseClipboardPairs()`, and merges the result into `form` state.
5. "Save" prepends a new row (id: `NEW-<timestamp>`) to `rows`. There is no persistence.

### Row schema

All 18 fields, their types, and the one enum:

| Field | Type | Notes |
|---|---|---|
| `id` | string | auto-assigned on save |
| `PMS`, `WBS`, `PCM`, `PL`, `GL` | string | project codes |
| `FOProjectName` | string | display name |
| `POProjectStart`, `WkStart`, `ProjectEnd`, `WkEnd` | string | MM/DD/YYYY |
| `PRNumber`, `PO` | string | reference numbers |
| `PRStatus` | `"OPEN"` \| `"CLOSED"` | dropdown in grid; closed rows get red CSS class `row-closed` |
| `POManWks`, `PRAmount`, `PRWklyRate`, `POMonthlyBillRate` | number | |

### Clipboard parsing (`parseClipboardPairs`)

Accepts JSON (`{…}` or `[…]`) or plain-text key/value pairs separated by `:`, `=`, `,`, or tab. Keys are normalized (lowercased, non-alphanumeric stripped) and resolved through `FIELD_ALIASES` to canonical field names. Numeric fields are coerced to `Number`; `PRStatus` is uppercased and defaulted to `"OPEN"`.

### AG Grid configuration

- Uses `ag-grid-community` + `ag-grid-enterprise` v34.1.2 with the React wrapper.
- `AllCommunityModule` is registered globally at module load time.
- Theme: `themeQuartz.withParams({…})` — blue palette, tight spacing.
- All columns have `editable: true`, `filter: true`, `sortable: true`, `resizable: true`, `floatingFilter: true` by default.
- `PRStatus` overrides to `agSelectCellEditor` with `agSetColumnFilter`.
- `getRowId` returns `data.id` — required for AG Grid to track rows correctly.

## Known issues in existing code

- `pad2` and `toMDY` are **defined twice** — once at module scope and again inside `parseClipboardPairs`. The inner definitions shadow the outer ones.
- `ymd()` and `DATE_FIELDS` are defined but never used.
- `toYMD()` at module scope references an undefined `MDYtoYMD` and an undeclared `d` — it is dead code with a runtime bug if called.
- The inner `toYMD` inside `parseClipboardPairs` is a no-op stub (returns the value as-is).

## Important notes

- **README.md** describes a completely different system (an ASP.NET WebForms NBI intake app). It is a legacy artifact and does not describe this React codebase.
- No `.gitignore` is present; `node_modules/` and `dist/` are tracked by git.
- No TypeScript — the project uses plain JSX throughout.
