"use client";

import React, { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

// AG Grid core + theme (registered once here)
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

// Two grids (separate files)
import PeopleGrid from "./PeopleGrid";
import POsGrid from "./POsGrid";

// Config
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5902";

// Shared theme instance
const myTheme = themeQuartz.withParams({
  spacing: 2,
  foregroundColor: "rgb(14, 68, 145)",
  backgroundColor: "rgb(241, 247, 255)",
  headerBackgroundColor: "rgb(228, 237, 250)",
  rowHoverColor: "rgb(216, 226, 255)",
});

function App() {
  const [tab, setTab] = useState("people");
  const theme = useMemo(() => myTheme, []);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 12 }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Supplier Staffing Dashboard</h2>
        <div style={{ fontSize: 12, opacity: 0.75 }}>API: {API_BASE}</div>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === "people" ? "active" : ""}`}
          onClick={() => setTab("people")}
        >
          Resource
        </button>
        <button
          className={`tab ${tab === "pos" ? "active" : ""}`}
          onClick={() => setTab("pos")}
        >
          POs
        </button>
      </div>

      <div className="tab-panel">
        {tab === "people" ? (
          <PeopleGrid apiBase={API_BASE} theme={theme} />
        ) : (
          <POsGrid apiBase={API_BASE} theme={theme} />
        )}
      </div>

      <style>{`
        :root { --radius: 12px; --shadow: 0 8px 24px rgba(0,0,0,0.12); --fc: #0e4491; }
        * { box-sizing: border-box; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; background:#f3f7ff; color:#0b254b; margin:0; }

        .tabs { display:flex; gap:8px; margin-bottom:8px; }
        .tab {
          appearance:none; border:1px solid rgba(0,0,0,0.1); background:#fff; padding:8px 12px;
          border-radius:10px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,0.06);
        }
        .tab.active { background: var(--fc); color:#fff; border-color: transparent; }
        .tab-panel { background:#fff; border-radius: var(--radius); padding: 10px; box-shadow: var(--shadow); }
      `}</style>
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
