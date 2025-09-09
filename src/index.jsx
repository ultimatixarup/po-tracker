"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import React, {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { useFetchJson } from "./useFetchJson";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

ModuleRegistry.registerModules([AllCommunityModule]);

const myTheme = themeQuartz.withParams({
  spacing: 2,
  foregroundColor: "rgb(14, 68, 145)",
  backgroundColor: "rgb(241, 247, 255)",
  headerBackgroundColor: "rgb(228, 237, 250)",
  rowHoverColor: "rgb(216, 226, 255)",
});


const pad2 = (n) => String(n).padStart(2, "0");

export function dateToMDY(d, sep = "/") {
  if (!(d instanceof Date) || isNaN(d)) return "";
  return `${pad2(d.getMonth() + 1)}${sep}${pad2(d.getDate())}${sep}${d.getFullYear()}`;
}

// Format to "MM/DD/YYYY" from either "YYYY-MM-DD" or Date/other parsables
const toMDY = (v) => {
  if (!v) return "";
  // already YYYY-MM-DD?
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;

  // try native Date
  const d = v instanceof Date ? v : new Date(String(v));
  if (!isNaN(d)) {
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
  }
  return String(v);
};

const ymd = (d) => (d);

const emptyForm = () => {
  const now = new Date();
  const wkEnd = new Date(now); wkEnd.setDate(now.getDate() + 6);
  const projEnd = new Date(now); projEnd.setMonth(now.getMonth() + 3);
  return {
    PMS: "",
    WBS: "",
    PCM: "",
    PL: "",
    GL: "",
    FOProjectName: "",
    POProjectStart: dateToMDY(now),
    WkStart: dateToMDY(now),
    ProjectEnd: dateToMDY(projEnd),
    WkEnd: dateToMDY(wkEnd),
    PRNumber: "",
    PRStatus: "OPEN",
    PO: "",
    POManWks: 0,
    PRAmount: 0,
    PRWklyRate: 0,
    POMonthlyBillRate: 0,
  };
};

const GridExample = () => {
  const gridRef = useRef(null);
  const containerStyle = useMemo(() => ({ width: "100%" }), []);
  const gridStyle = useMemo(() => ({ width: "100%", height: "600px" }), []);
  const theme = useMemo(() => myTheme, []);

  // ---- data ----
  const { data } = useFetchJson("/data.json");
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (Array.isArray(data)) setRows(data);
  }, [data]);

  // ---- columns ----
  const [columnDefs] = useState([
    { headerName: "ID", field: "id" },
    { headerName: "PMS", field: "PMS" },
    { headerName: "WBS", field: "WBS" },
    { headerName: "PCM", field: "PCM" },
    { headerName: "PL", field: "PL" },
    { headerName: "GL", field: "GL" },
    { headerName: "Project Name", field: "FOProjectName" },
    { headerName: "Project Start", field: "POProjectStart"},
    { headerName: "Week Start", field: "WkStart"},
    { headerName: "Project End", field: "ProjectEnd" },
    { headerName: "Week End", field: "WkEnd" },
    { headerName: "PR Number", field: "PRNumber" },
    {
      headerName: "PR Status",
      field: "PRStatus",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["OPEN", "CLOSED"] },
      filter: "agSetColumnFilter",
    },
    { headerName: "PO", field: "PO" },
    { headerName: "PO Man Weeks", field: "POManWks", type: "numericColumn" },
    { headerName: "PR Amount", field: "PRAmount", type: "numericColumn" },
    { headerName: "PR Weekly Rate", field: "PRWklyRate", type: "numericColumn" },
    { headerName: "PO Monthly Bill Rate", field: "POMonthlyBillRate", type: "numericColumn" },
  ]);

  const defaultColDef = useMemo(
    () => ({
      editable: true,
      filter: true,
      sortable: true,
      resizable: true,
      floatingFilter: true,
    }),
    []
  );

  const getRowId = useCallback((p) => p.data.id, []);

  // ---- modal form state ----
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const openForm = () => {
    setForm(emptyForm());
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);

  const onField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onNumber = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
  };

// --- Clipboard parsing helpers (place ABOVE your component) ---
const FIELD_ALIASES = {
  pms: "PMS",
  wbs: "WBS",
  pcm: "PCM",
  pl: "PL",
  gl: "GL",
  projectname: "FOProjectName",
  foprojectname: "FOProjectName",

  poprojectstart: "POProjectStart",
  "po project start": "POProjectStart",
  startdate: "POProjectStart",

  wkstart: "WkStart",
  weekstart: "WkStart",

  projectend: "ProjectEnd",
  enddate: "ProjectEnd",

  wkend: "WkEnd",
  weekend: "WkEnd",

  prnumber: "PRNumber",
  "pr number": "PRNumber",

  prstatus: "PRStatus",
  "pr status": "PRStatus",
  status: "PRStatus",

  po: "PO",

  pomanwks: "POManWks",
  "po man weeks": "POManWks",

  pramount: "PRAmount",
  "pr amount": "PRAmount",

  prwklyrate: "PRWklyRate",
  "pr weekly rate": "PRWklyRate",

  pomonthlybillrate: "POMonthlyBillRate",
  "po monthly bill rate": "POMonthlyBillRate",
};

const NUMERIC_FIELDS = new Set(["POManWks", "PRAmount", "PRWklyRate", "POMonthlyBillRate"]);
const DATE_FIELDS = new Set([]);

const normalizeKey = (k) =>
  (k ?? "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")       // keep word boundaries
    .trim()
    .replace(/\s+/g, "");              // then collapse to compare

const parseClipboardPairs = (text) => {
  const toYMD = (v) => {

    return v;
    // if (!v) return "";
    // const d = v instanceof Date ? v : new Date(String(v));
    // return isNaN(d) ? "" : d.toISOString().slice(0, 10);
  };

  let obj = {};
  const t = (text || "").trim();

  // Try JSON first
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j)) {
        j.forEach((item) => item && typeof item === "object" && Object.assign(obj, item));
      } else if (j && typeof j === "object") {
        obj = j;
      }
    } catch { /* fall through */ }
  }

  // Fallback to line parsing
  if (Object.keys(obj).length === 0 && t) {
    const lines = t.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      // key: value | key = value | key,value | key\tvalue
      const parts = line.split(/\s*[:=,\t]\s*/);
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join(" "); // keep colons in values
        obj[key] = value;
      }
    }
  }

  const pad2 = (n) => String(n).padStart(2, "0");

// Format to "MM/DD/YYYY" from either "YYYY-MM-DD" or Date/other parsables
const toMDY = (v) => {
  if (!v) return "";
  // already YYYY-MM-DD?
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;

  // try native Date
  const d = v instanceof Date ? v : new Date(String(v));
  if (!isNaN(d)) {
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
  }
  return String(v);
};




  // Map/normalize
  const result = {};
  for (const [rawKey, rawVal] of Object.entries(obj)) {
    const field = FIELD_ALIASES[normalizeKey(rawKey)];
    if (!field) continue;

    let v = (rawVal ?? "").toString().trim();

    if (NUMERIC_FIELDS.has(field)) {
      const n = Number(v);
      v = Number.isFinite(n) ? n : 0;
    } else if (field === "PRStatus") {
      const up = v.toUpperCase();
      v = up === "CLOSED" ? "CLOSED" : "OPEN";
    }
    result[field] = v;
  }

  return result;
};


/** General: format any reasonable input as YMD or MDY */
const toYMD = (v) => {
  // Already YMD?
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return String(v);
  // MDY?
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(String(v))) return MDYtoYMD(v);
  // Fallback: try Date parse
  //const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(d) ? "" : ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
};




  // 👇 NEW: Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      alert(`Pasting from clipboard:\n\n${text}`);
      const patch = parseClipboardPairs(text);
      if (Object.keys(patch).length === 0) {
        alert("No recognizable name/value pairs found in clipboard.");
        return;
      }
      setForm((f) => ({ ...f, ...patch }));
      
    } catch (err) {
      console.error(err);
      alert(
        "Could not read clipboard. Please allow clipboard permissions or paste into a text area."
      );
    }
  };

  const saveRow = () => {
    const newRow = {
      id: `NEW-${Date.now()}`,
      ...form,
      // normalize dates to YYYY-MM-DD
      POProjectStart: form.POProjectStart,
      WkStart: form.WkStart,
      ProjectEnd: form.ProjectEnd,
      WkEnd: form.WkEnd,
      // ensure numbers
      POManWks: Number(form.POManWks || 0),
      PRAmount: Number(form.PRAmount || 0),
      PRWklyRate: Number(form.PRWklyRate || 0),
      POMonthlyBillRate: Number(form.POMonthlyBillRate || 0),
      PRStatus: (form.PRStatus || "OPEN").toUpperCase(),
    };
    setRows((prev) => [newRow, ...prev])
    setShowForm(false);
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        <button onClick={openForm}>Add New</button>
      </div>

      {/* Modal (no external deps) */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={closeForm}
        >
          <div
            style={{
              width: 720,
              maxHeight: "85vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Add New Row</h3>
              <button onClick={closeForm} aria-label="Close">✕</button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {/* Left column */}
              <label>
                <div>Project Name</div>
                <input
                  name="FOProjectName"
                  value={form.FOProjectName}
                  onChange={onField}
                  placeholder="New Project"
                />
              </label>

              <label>
                <div>PMS</div>
                <input name="PMS" value={form.PMS} onChange={onField} />
              </label>

              <label>
                <div>WBS</div>
                <input name="WBS" value={form.WBS} onChange={onField} />
              </label>

              <label>
                <div>PCM</div>
                <input name="PCM" value={form.PCM} onChange={onField} />
              </label>

              <label>
                <div>PL</div>
                <input name="PL" value={form.PL} onChange={onField} />
              </label>

              <label>
                <div>GL</div>
                <input name="GL" value={form.GL} onChange={onField} />
              </label>

              <label>
                <div>PR Number</div>
                <input name="PRNumber" value={form.PRNumber} onChange={onField} />
              </label>

              <label>
                <div>PR Status</div>
                <select name="PRStatus" value={form.PRStatus} onChange={onField}>
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </label>

              <label>
                <div>PO</div>
                <input name="PO" value={form.PO} onChange={onField} />
              </label>

              <label>
                <div>PO Man Weeks</div>
                <input
                  type="number"
                  name="POManWks"
                  value={form.POManWks}
                  onChange={onNumber}
                  min="0"
                />
              </label>

              <label>
                <div>PR Amount</div>
                <input
                  type="number"
                  name="PRAmount"
                  value={form.PRAmount}
                  onChange={onNumber}
                  min="0"
                />
              </label>

              <label>
                <div>PR Weekly Rate</div>
                <input
                  type="number"
                  name="PRWklyRate"
                  value={form.PRWklyRate}
                  onChange={onNumber}
                  min="0"
                />
              </label>

              <label>
                <div>PO Monthly Bill Rate</div>
                <input
                  type="number"
                  name="POMonthlyBillRate"
                  value={form.POMonthlyBillRate}
                  onChange={onNumber}
                  min="0"
                />
              </label>

              {/* Dates */}
              <label>
                <div>Project Start</div>
                <input
                  
                  name="POProjectStart"
                  value={form.POProjectStart}
                  onChange={onField}
                />
              </label>

              <label>
                <div>Week Start</div>
                <input
                  
                  name="WkStart"
                  value={form.WkStart}
                  onChange={onField}
                />
              </label>

              <label>
                <div>Project End</div>
                <input
                  
                  name="ProjectEnd"
                  value={form.ProjectEnd}
                  onChange={onField}
                />
              </label>

              <label>
                <div>Week End</div>
                <input
                  
                  name="WkEnd"
                  value={form.WkEnd}
                  onChange={onField}
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button type="button" onClick={pasteFromClipboard} title="Paste name/value pairs from clipboard">
                  Paste from Clipboard
                </button>
              <button onClick={closeForm}>Cancel</button>
              <button onClick={saveRow}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={gridStyle} className="ag-theme-quartz">
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowId={getRowId}
          theme={theme}
          rowClassRules={{
            "row-closed": (p) => p.data?.PRStatus === "CLOSED",
          }}
        />
      </div>

      {/* Optional row coloring styles */}
      <style>{`
        .row-closed {
          background-color: #ffe6e6 !important;
          color: #800 !important;
          font-weight: 600;
        }
        input, select {
          width: 100%;
          box-sizing: border-box;
          padding: 6px 8px;
        }
        label > div {
          font-size: 12px;
          color: #555;
          margin-bottom: 4px;
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
