"use client";

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

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

/** ====== CONFIG: point this to your REST API ====== */
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5902/db/po_db";

/** ====== THEME ====== */
const myTheme = themeQuartz.withParams({
  spacing: 2,
  foregroundColor: "rgb(14, 68, 145)",
  backgroundColor: "rgb(241, 247, 255)",
  headerBackgroundColor: "rgb(228, 237, 250)",
  rowHoverColor: "rgb(216, 226, 255)",
});

/** ====== DATE HELPERS (display as MM/DD/YYYY, accept many inputs) ====== */
const pad2 = (n) => String(n).padStart(2, "0");
const YMDtoMDY = (s, sep = "/") => {
  const m = String(s || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? [m[2], m[3], m[1]].join(sep) : "";
};
const toMDY = (v) => {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return YMDtoMDY(v);
  const d = v instanceof Date ? v : new Date(String(v));
  if (!isNaN(d))
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
  const m = String(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    let [, M, D, Y] = m.map(Number);
    if (Y < 100) Y += Y >= 50 ? 1900 : 2000;
    return `${pad2(M)}/${pad2(D)}/${Y}`;
  }
  return String(v);
};

/** ====== CURRENCY HELPERS ====== */
const formatUSD = (v) => {
  const n = Number(v);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
};
const parseUSD = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[^0-9.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

/** ====== DEFAULTS (fields aligned to your new column set) ====== */
/*
  Field mapping:
  - Deliverable Point of Contact OR ASML Acronym -> DPOCOrAcronym
  - FO N-Type                                    -> FONType
  - Supplier                                     -> Supplier
  - Group (SDev, CDev)                           -> GroupType
  - Project                                      -> Project
  - Program                                      -> Program
  - PBS                                          -> PBS
  - WBS                                          -> WBS
  - PCM                                          -> PCM
  - PL                                           -> PL
  - GL                                           -> GL
  - GTL                                          -> GTL
  - FO Project Name (Project Group Description YYQQ FO) -> FOProjectName
  - PO Project Start                             -> POProjectStart (date)
  - wkStart                                      -> WkStart (date)
  - Project End                                  -> ProjectEnd (date)
  - wkEnd                                        -> WkEnd (date)
  - PR Number                                    -> PRNumber
  - PR Status (...)                              -> PRStatus
  - PO (pending)                                 -> PO
  - PO Man Wks                                   -> POManWks (number)
  - PR Amount                                    -> PRAmount (number)
  - PR Wkly Rate                                 -> PRWklyRate (number)
  - PR Hrly Bill Rate                            -> PRHrlyBillRate (number)
*/
const emptyForm = () => {
  const today = new Date();
  return {
    DPOCOrAcronym: "",
    FONType: "",
    Supplier: "",
    GroupType: "",
    Project: "",
    Program: "",
    PBS: "",
    WBS: "",
    PCM: "",
    PL: "",
    GL: "",
    GTL: "",
    FOProjectName: "",
    POProjectStart: toMDY(today),
    WkStart: toMDY(today),
    ProjectEnd: "",
    WkEnd: "",
    PRNumber: "",
    PRStatus: "TBD",
    PO: "",
    POManWks: 0,
    PRAmount: 0,
    PRWklyRate: 0,
    PRHrlyBillRate: 0,
  };
};

// Clipboard parsing helpers – include aliases for your new fields
const FIELD_ALIASES = {
  // names -> field keys
  "deliverable point of contact or asml acronym": "DPOCOrAcronym",
  "asml acronym": "DPOCOrAcronym",
  dpoc: "DPOCOrAcronym",
  dpocorasmlacronym: "DPOCOrAcronym",

  "fo n-type": "FONType",
  "fo n type": "FONType",
  fontype: "FONType",

  supplier: "Supplier",
  "group (sdev, cdev)": "GroupType",
  group: "GroupType",
  project: "Project",
  program: "Program",
  pbs: "PBS",
  wbs: "WBS",
  pcm: "PCM",
  pl: "PL",
  gl: "GL",
  gtl: "GTL",

  "fo project name (project group description yyqq fo)": "FOProjectName",
  foprojectname: "FOProjectName",
  "fo project name": "FOProjectName",

  "po project start": "POProjectStart",
  poprojectstart: "POProjectStart",
  wkstart: "WkStart",
  "project end": "ProjectEnd",
  projectend: "ProjectEnd",
  wkend: "WkEnd",

  "pr number": "PRNumber",
  prnumber: "PRNumber",

  "pr status": "PRStatus",
  prstatus: "PRStatus",

  "po (pending)": "PO",
  po: "PO",

  "po man wks": "POManWks",
  pomanwks: "POManWks",

  "pr amount": "PRAmount",
  pramount: "PRAmount",

  "pr wkly rate": "PRWklyRate",
  prwklyrate: "PRWklyRate",

  "pr hrly bill rate": "PRHrlyBillRate",
  prhrlybillrate: "PRHrlyBillRate",
};
const NUMERIC_FIELDS = new Set([
  "POManWks",
  "PRAmount",
  "PRWklyRate",
  "PRHrlyBillRate",
]);
const normalizeKey = (k) =>
  (k ?? "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseClipboardPairs = (text) => {
  let obj = {};
  const t = (text || "").trim();
  // Try JSON first
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j))
        j.forEach((it) => it && typeof it === "object" && Object.assign(obj, it));
      else if (j && typeof j === "object") obj = j;
    } catch {}
  }
  // Fallback to key: value lines
  if (Object.keys(obj).length === 0 && t) {
    const lines = t.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const parts = line.split(/\s*[:=,\t]\s*/);
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join(" ");
        obj[key] = value;
      }
    }
  }
  const result = {};
  for (const [rawKey, rawVal] of Object.entries(obj)) {
    const field = FIELD_ALIASES[normalizeKey(rawKey)];
    if (!field) continue;
    let v = (rawVal ?? "").toString().trim();
    if (NUMERIC_FIELDS.has(field)) {
      const n = Number(v.replace(/[$, ]/g, ""));
      v = Number.isFinite(n) ? n : 0;
    } else if (["POProjectStart", "WkStart", "ProjectEnd", "WkEnd"].includes(field)) {
      v = toMDY(v);
    } else if (field === "PRStatus") {
      const up = v.toUpperCase();
      const allowed = [
        "TBD",
        "PENDING QUOTE",
        "SUBMITTED",
        "APPROVED",
        "RECEIVING",
        "FULLY RECEIVED",
        "EXPIRED",
        "CANCELLED",
      ];
      v = allowed.includes(up) ? up : "TBD";
    }
    result[field] = v;
  }
  return result;
};

/** ====== MAIN COMPONENT ====== */
const POsGrid = () => {
  const gridRef = useRef(null);

  // Layout styles
  const containerStyle = useMemo(
    () => ({
      width: "100%",
      maxWidth: 1300,
      margin: "0 auto",
      padding: 12,
      boxSizing: "border-box",
    }),
    []
  );
  const gridStyle = useMemo(
    () => ({ width: "100%", height: "70vh", minHeight: 500 }),
    []
  );
  const theme = useMemo(() => myTheme, []);

  // Data state (LIVE)
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
      const mapped = (json.rows || []).map(docToRow);
      setRows(mapped);
    } catch (e) {
      console.error(e);
      alert("Failed to load rows from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  /** ====== COLUMNS (your new set, with currency formatting) ====== */
  const [columnDefs] = useState([
    { headerName: "ID", field: "id", hide: true },

    { headerName: "Deliverable Point of Contact OR ASML Acronym", field: "DPOCOrAcronym", minWidth: 260, flex: 1 },
    { headerName: "FO N-Type", field: "FONType", minWidth: 120 },
    { headerName: "Supplier", field: "Supplier", minWidth: 140 },
    { headerName: "Group (SDev, CDev)", field: "GroupType", minWidth: 160 },
    { headerName: "Project", field: "Project", minWidth: 160 },
    { headerName: "Program", field: "Program", minWidth: 140 },
    { headerName: "PBS", field: "PBS", minWidth: 120 },
    { headerName: "WBS", field: "WBS", minWidth: 120 },
    { headerName: "PCM", field: "PCM", minWidth: 120 },
    { headerName: "PL", field: "PL", minWidth: 120 },
    { headerName: "GL", field: "GL", minWidth: 120 },
    { headerName: "GTL", field: "GTL", minWidth: 120 },
    { headerName: "FO Project Name (Project Group Description YYQQ FO)", field: "FOProjectName", minWidth: 260 },

    { headerName: "PO Project Start", field: "POProjectStart", valueFormatter: ({ value }) => toMDY(value), minWidth: 150 },
    { headerName: "wkStart", field: "WkStart", valueFormatter: ({ value }) => toMDY(value), minWidth: 140 },
    { headerName: "Project End", field: "ProjectEnd", valueFormatter: ({ value }) => toMDY(value), minWidth: 150 },
    { headerName: "wkEnd", field: "WkEnd", valueFormatter: ({ value }) => toMDY(value), minWidth: 140 },

    { headerName: "PR Number", field: "PRNumber", minWidth: 140 },
    {
      headerName: "PR Status (TBD, Pending Quote, Submitted, Approved, Receiving, Fully Received, Expired, Cancelled)",
      field: "PRStatus",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: [
          "TBD",
          "PENDING QUOTE",
          "SUBMITTED",
          "APPROVED",
          "RECEIVING",
          "FULLY RECEIVED",
          "EXPIRED",
          "CANCELLED",
        ],
      },
      filter: "agSetColumnFilter",
      minWidth: 360,
    },
    { headerName: "PO (pending)", field: "PO", minWidth: 140 },

    { headerName: "PO Man Wks", field: "POManWks", type: "numericColumn", minWidth: 140 },

    {
      headerName: "PR Amount",
      field: "PRAmount",
      type: "numericColumn",
      minWidth: 140,
      cellClass: "ag-right-aligned-cell",
      valueFormatter: ({ value }) => formatUSD(value),
      valueParser: (p) => parseUSD(p.newValue),
    },
    {
      headerName: "PR Wkly Rate",
      field: "PRWklyRate",
      type: "numericColumn",
      minWidth: 140,
      cellClass: "ag-right-aligned-cell",
      valueFormatter: ({ value }) => formatUSD(value),
      valueParser: (p) => parseUSD(p.newValue),
    },
    {
      headerName: "PR Hrly Bill Rate",
      field: "PRHrlyBillRate",
      type: "numericColumn",
      minWidth: 160,
      cellClass: "ag-right-aligned-cell",
      valueFormatter: ({ value }) => formatUSD(value),
      valueParser: (p) => parseUSD(p.newValue),
    },

    // Actions
    {
      headerName: "",
      field: "__actions",
      pinned: "right",
      width: 92,
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
          if (!window.confirm("Delete this row? This cannot be undone.")) return;
          try {
            const doc = await doGetDoc(p.data.id);
            const rev = doc?._rev;
            if (!rev) throw new Error("Missing _rev for delete");
            const r = await fetch(
              `${API_BASE}/items/${encodeURIComponent(p.data.id)}?rev=${encodeURIComponent(rev)}`,
              { method: "DELETE" }
            );
            if (!r.ok) throw new Error(`Delete failed: ${r.status}`);
            setRows((prev) => prev.filter((x) => x.id !== p.data.id));
          } catch (e) {
            console.error(e);
            alert("Delete failed.");
          }
        };

        const handleCopy = async () => {
          try {
            const source = await doGetDoc(p.data.id);
            const { _id, _rev, ...rest } = source || {};
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
            alert("Copy failed.");
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
      minWidth: 140,
    }),
    []
  );

  const getRowId = useCallback((p) => p.data.id, []);

  // Modal form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const openForm = () => {
    setForm(emptyForm());
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);

  // Scroll lock on modal open
  useEffect(() => {
    document.body.classList.toggle("modal-open", showForm);
    return () => document.body.classList.remove("modal-open");
  }, [showForm]);

  const onField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const onNumber = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value === "" ? "" : Number(value) }));
  };

  // Create
  const saveRow = async () => {
    try {
      const payload = {
        ...form,
        POManWks: Number(form.POManWks || 0),
        PRAmount: Number(form.PRAmount || 0),
        PRWklyRate: Number(form.PRWklyRate || 0),
        PRHrlyBillRate: Number(form.PRHrlyBillRate || 0),
      };
      const r = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`Create failed: ${r.status}`);
      const saved = await r.json();
      const newRow = docToRow(saved);
      setRows((prev) => [newRow, ...prev]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Create failed.");
    }
  };

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

  // Paste from clipboard → merge into form
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
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

  return (
    <div style={containerStyle}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button className="btn" onClick={openForm}>Add New</button>
        <button className="btn" onClick={loadRows} disabled={loading}>
          {loading ? "Loading…" : "Reload"}
        </button>
        <span style={{ marginLeft: "auto", opacity: 0.75, fontSize: 12 }}>
          API: {API_BASE}
        </span>
      </header>

      {/* Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add New PO</h3>
              <button className="btn btn-ghost" onClick={closeForm} aria-label="Close">✕</button>
            </div>

            <div className="grid2">
              <label><div>Deliverable Point of Contact OR ASML Acronym</div><input name="DPOCOrAcronym" value={form.DPOCOrAcronym} onChange={onField} /></label>
              <label><div>FO N-Type</div><input name="FONType" value={form.FONType} onChange={onField} /></label>
              <label><div>Supplier</div><input name="Supplier" value={form.Supplier} onChange={onField} /></label>
              <label><div>Group (SDev, CDev)</div><input name="GroupType" value={form.GroupType} onChange={onField} /></label>
              <label><div>Project</div><input name="Project" value={form.Project} onChange={onField} /></label>
              <label><div>Program</div><input name="Program" value={form.Program} onChange={onField} /></label>
              <label><div>PBS</div><input name="PBS" value={form.PBS} onChange={onField} /></label>
              <label><div>WBS</div><input name="WBS" value={form.WBS} onChange={onField} /></label>
              <label><div>PCM</div><input name="PCM" value={form.PCM} onChange={onField} /></label>
              <label><div>PL</div><input name="PL" value={form.PL} onChange={onField} /></label>
              <label><div>GL</div><input name="GL" value={form.GL} onChange={onField} /></label>
              <label><div>GTL</div><input name="GTL" value={form.GTL} onChange={onField} /></label>
              <label><div>FO Project Name (Project Group Description YYQQ FO)</div><input name="FOProjectName" value={form.FOProjectName} onChange={onField} /></label>

              <label><div>PO Project Start</div><input name="POProjectStart" value={form.POProjectStart} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>wkStart</div><input name="WkStart" value={form.WkStart} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Project End</div><input name="ProjectEnd" value={form.ProjectEnd} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>wkEnd</div><input name="WkEnd" value={form.WkEnd} onChange={onField} placeholder="MM/DD/YYYY" /></label>

              <label><div>PR Number</div><input name="PRNumber" value={form.PRNumber} onChange={onField} /></label>
              <label>
                <div>PR Status</div>
                <select name="PRStatus" value={form.PRStatus} onChange={onField}>
                  <option>TBD</option>
                  <option>PENDING QUOTE</option>
                  <option>SUBMITTED</option>
                  <option>APPROVED</option>
                  <option>RECEIVING</option>
                  <option>FULLY RECEIVED</option>
                  <option>EXPIRED</option>
                  <option>CANCELLED</option>
                </select>
              </label>
              <label><div>PO (pending)</div><input name="PO" value={form.PO} onChange={onField} /></label>

              <label><div>PO Man Wks</div><input type="number" name="POManWks" value={form.POManWks} onChange={onNumber} /></label>
              <label><div>PR Amount</div><input type="number" name="PRAmount" value={form.PRAmount} onChange={onNumber} /></label>
              <label><div>PR Wkly Rate</div><input type="number" name="PRWklyRate" value={form.PRWklyRate} onChange={onNumber} /></label>
              <label><div>PR Hrly Bill Rate</div><input type="number" name="PRHrlyBillRate" value={form.PRHrlyBillRate} onChange={onNumber} /></label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={pasteFromClipboard}>
                Paste from Clipboard
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRow}>Save</button>
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
          animateRows={true}
          onCellValueChanged={onCellValueChanged}
        />
      </div>

      <style>{`
        :root {
          --radius: 12px;
          --shadow: 0 8px 24px rgba(0,0,0,0.12);
          --fc: #0e4491;
        }
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans";
               color: #0b254b; background: #f3f7ff; }

        header .btn { margin-right: 6px; }

        .btn {
          appearance: none;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform .05s ease, box-shadow .15s ease, background .2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.10); }
        .btn:active { transform: translateY(0); }
        .btn-primary { background: var(--fc); color: #fff; border-color: transparent; }
        .btn-ghost { background: transparent; border-color: transparent; }

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
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .icon-btn-danger { color: #b3261e; border-color: #f0c9c7; }
        .icon-btn-danger:hover { background: #ffecec; }
        .icon-btn-neutral { color: #0b254b; border-color: #d3dbe7; }
        .icon-btn-neutral:hover { background: #edf3ff; }

        .grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        label > div {
          font-size: 12px;
          color: #4c596b;
          margin-bottom: 4px;
        }
        input, select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          outline: none;
        }
        input:focus, select:focus { border-color: var(--fc); box-shadow: 0 0 0 3px rgba(14,68,145,0.12); }

        .actions-cell { display: flex; align-items: center; justify-content: center; }

        .ag-theme-quartz .ag-cell-inline-editing input {
          width: 100% !important;
          min-width: 160px;
          padding: 4px 6px;
          font-size: 14px;
        }

        .ag-right-aligned-cell { text-align: right; }

        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 16px;
        }
        .modal {
          width: min(980px, 100%); max-height: 85vh; overflow: auto;
          background: #fff; border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow);
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;
        }
        .modal-actions {
          display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb;
        }

        body.modal-open { overflow: hidden; }
      `}</style>
    </div>
  );
};

export default POsGrid;
