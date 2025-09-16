"use client";

import React, {
    StrictMode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createRoot } from "react-dom/client";

import {
    AllCommunityModule,
    ModuleRegistry,
    themeQuartz,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

/** ====== CONFIG ====== */
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:3000";

/** ====== THEME ====== */
const myTheme = themeQuartz.withParams({
  spacing: 2,
  foregroundColor: "rgb(14, 68, 145)",
  backgroundColor: "rgb(241, 247, 255)",
  headerBackgroundColor: "rgb(228, 237, 250)",
  rowHoverColor: "rgb(216, 226, 255)",
});

/** ====== MAIN ====== */
const GridExample = () => {
  const gridRef = useRef(null);
  const containerStyle = useMemo(
    () => ({ width: "100%", maxWidth: 1300, margin: "0 auto", padding: 12 }),
    []
  );
  const gridStyle = useMemo(
    () => ({ width: "100%", height: "70vh", minHeight: 500 }),
    []
  );
  const theme = useMemo(() => myTheme, []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map server doc -> grid row
  const docToRow = (doc) => {
    const { _id, _rev, ...rest } = doc || {};
    return { id: _id, _rev, ...rest };
  };

  // Fetch list
  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/items?limit=500`);
      if (!r.ok) throw new Error(`List failed: ${r.status}`);
      const json = await r.json();
      setRows((json.rows || []).map(docToRow));
    } catch (e) {
      console.error(e);
      alert("Failed to load rows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // Columns
  const [columnDefs] = useState([
    { headerName: "ID", field: "id", editable: false, width: 120, pinned: "left" },
    { headerName: "PMS", field: "PMS" },
    { headerName: "WBS", field: "WBS" },
    { headerName: "PCM", field: "PCM" },
    { headerName: "PL", field: "PL" },
    { headerName: "GL", field: "GL" },
    { headerName: "Project Name", field: "FOProjectName", flex: 1, minWidth: 220 },
    { headerName: "PR Number", field: "PRNumber" },
    {
      headerName: "PR Status",
      field: "PRStatus",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["OPEN", "CLOSED"] },
      width: 160,
    },
    {
      headerName: "Actions",
      field: "__actions",
      pinned: "right",
      width: 100,
      filter: false,
      sortable: false,
      editable: false,
      cellClass: "actions-cell",
      cellRenderer: (p) => {
        const doGetDoc = async (id) => {
          const g = await fetch(`${API_BASE}/items/${encodeURIComponent(id)}`);
          if (!g.ok) throw new Error("Failed to fetch doc");
          return g.json();
        };

        const handleDelete = async () => {
          try {
            const doc = await doGetDoc(p.data.id);
            const r = await fetch(
              `${API_BASE}/items/${encodeURIComponent(p.data.id)}?rev=${encodeURIComponent(doc._rev)}`,
              { method: "DELETE" }
            );
            if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
            setRows((prev) => prev.filter((x) => x.id !== p.data.id));
          } catch (e) {
            console.error(e);
            alert("Delete failed");
          }
        };

        const handleCopy = async () => {
          try {
            const doc = await doGetDoc(p.data.id);
            const { _id, _rev, ...rest } = doc || {};
            const payload = {
              ...rest,
              FOProjectName: rest.FOProjectName
                ? `${rest.FOProjectName} (copy)`
                : "(copy)",
            };
            const r = await fetch(`${API_BASE}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error(`Copy failed: ${r.status}`);
            const saved = await r.json();
            setRows((prev) => [docToRow(saved), ...prev]);
          } catch (e) {
            console.error(e);
            alert("Copy failed");
          }
        };

        return (
          <div className="actions-wrap">
            <button
              className="icon-btn icon-btn-neutral"
              onClick={handleCopy}
              title="Copy row"
              aria-label="Copy row"
            >
              ⧉
            </button>
            <button
              className="icon-btn icon-btn-danger"
              onClick={handleDelete}
              title="Delete row"
              aria-label="Delete row"
            >
              ×
            </button>
          </div>
        );
      },
    },
  ]);

  const defaultColDef = useMemo(
    () => ({
      editable: true,
      filter: true,
      sortable: true,
      resizable: true,
      floatingFilter: true,
      minWidth: 160,
    }),
    []
  );

  const getRowId = useCallback((p) => p.data.id, []);

  // Inline update
  const onCellValueChanged = async (params) => {
    const { data, colDef, newValue, oldValue } = params;
    if (newValue === oldValue) return;
    const field = colDef.field;
    if (!data?.id || !field) return;

    try {
      const r = await fetch(`${API_BASE}/items/${encodeURIComponent(data.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (!r.ok) throw new Error(`Patch failed: ${r.status}`);
      const saved = await r.json();
      const updated = docToRow(saved);
      setRows((prev) =>
        prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
      );
    } catch (e) {
      console.error(e);
      alert("Update failed. Reverting cell.");
      params.node.setDataValue(field, oldValue);
    }
  };

  return (
    <div style={containerStyle}>
      <header style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className="btn" onClick={loadRows} disabled={loading}>
          {loading ? "Loading…" : "Reload"}
        </button>
        <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
          API: {API_BASE}
        </span>
      </header>

      <div style={gridStyle} className="ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          theme={theme}
          animateRows
          rowClassRules={{ "row-closed": (p) => p.data?.PRStatus === "CLOSED" }}
          onCellValueChanged={onCellValueChanged}
        />
      </div>

      <style>{`
        .btn {
          padding: 6px 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
        }

        .actions-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
        }
        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          padding: 0;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 6px;
          background: #fff;
          line-height: 1;
          font-size: 12px;
          cursor: pointer;
        }
        .icon-btn-danger { color: #b3261e; }
        .icon-btn-neutral { color: #0b254b; }

        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Inline editors styled like Quartz floating filter boxes */
        .ag-theme-quartz .ag-cell.ag-cell-inline-editing {
          padding: 2px !important;
          overflow: visible;
        }
        .ag-theme-quartz .ag-cell-inline-editing .ag-cell-editor,
        .ag-theme-quartz .ag-cell-inline-editing .ag-text-field,
        .ag-theme-quartz .ag-cell-inline-editing .ag-input-field,
        .ag-theme-quartz .ag-cell-inline-editing .ag-input-wrapper {
          width: 100% !important;
          height: auto !important;
          display: flex;
          align-items: stretch;
        }
        .ag-theme-quartz .ag-cell-inline-editing input,
        .ag-theme-quartz .ag-cell-inline-editing select,
        .ag-theme-quartz .ag-cell-inline-editing textarea,
        .ag-theme-quartz .ag-cell-inline-editing .ag-input-field-input {
          width: 100% !important;
          min-width: 0 !important;
          height: 32px;
          line-height: 28px;
          padding: 0 10px;
          margin: 0;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          font-size: 14px;
          box-shadow: none;
          appearance: none;
        }
        .ag-theme-quartz .ag-cell-inline-editing input:focus,
        .ag-theme-quartz .ag-cell-inline-editing select:focus,
        .ag-theme-quartz .ag-cell-inline-editing textarea:focus {
          border-color: rgb(14, 68, 145);
          box-shadow: 0 0 0 3px rgba(14, 68, 145, 0.12);
        }
        .ag-theme-quartz .ag-center-cols-container .ag-row {
          height: 34px;
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <GridExample />
  </StrictMode>
);
