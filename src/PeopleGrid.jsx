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
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5902/db/people_db";

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
  // Already Y-M-D?
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return YMDtoMDY(v);
  // Try native Date
  const d = v instanceof Date ? v : new Date(String(v));
  if (!isNaN(d)) return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
  // Try M/D/Y simple
  const m = String(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (m) {
    let [ , M, D, Y ] = m.map(Number);
    if (Y < 100) Y += Y >= 50 ? 1900 : 2000;
    return `${pad2(M)}/${pad2(D)}/${Y}`;
  }
  return String(v);
};

/** ====== EMPTY FORM (defaults) ====== */
const emptyForm = () => {
  const today = new Date();
  return {
    SupplierPointOfContact: "",
    LastName: "",
    ASMLAcronym: "",
    DPOCStartDate: toMDY(today),
    PeoplePortalStatus: "",
    LTOrdered: "NO",
    UpdateFODLs: "NO",
    YUYVSpreadsheetUpdated: "NO",
    EmployeeID: "",
    Group25201553: "",
    ProjectRole: "",
    FirstDayFO: toMDY(today),
    PrjStart: toMDY(today),
    CurrentPOEnd: "",
    Supplier: "",
    LastDayFO: "",
    CurrentProject: "",
    HrlyBillRate: 0,
    PayReviewedDate: "",
    ProjectedPrjEnd: "",
    N: "NO",
    EighteenMonthDate: "",
    CurrentPOBalance: 0,
    BilledThru: "",
    WksRemaining: 0,
    POHrlyBillRate: 0,
    WeeklyRate: 0,
    GL: "",
    GTL: "",
  };
};

/** ====== MAIN COMPONENT ====== */
const PeopleGrid = () => {
  const gridRef = useRef(null);

  // Layout styles
  const containerStyle = useMemo(
    () => ({
      width: "100%",
      maxWidth: 1400,
      margin: "0 auto",
      padding: 12,
      boxSizing: "border-box",
    }),
    []
  );
  const gridStyle = useMemo(
    () => ({ width: "100%", height: "70vh", minHeight: 520 }),
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
    // NOTE: rest contains our new fields; server echoes them back as-is
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

  /** ====== COLUMNS: NEW STRUCTURE ====== */
  const [columnDefs] = useState([
    // Hidden id for stable keys
    { headerName: "ID", field: "id", hide: true },

    { headerName: "Supplier Point of Contact", field: "SupplierPointOfContact", minWidth: 220, flex: 1 },
    { headerName: "Last Name", field: "LastName", minWidth: 140 },
    { headerName: "ASML Acronym", field: "ASMLAcronym", minWidth: 140 },

    { headerName: "DPOC Start Date", field: "DPOCStartDate", valueFormatter: ({ value }) => toMDY(value), minWidth: 150 },
    { headerName: "People Portal Status", field: "PeoplePortalStatus", minWidth: 170 },

    {
      headerName: "LT Ordered?",
      field: "LTOrdered",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["YES", "NO"] },
      minWidth: 130,
    },
    {
      headerName: "Update FO DLs",
      field: "UpdateFODLs",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["YES", "NO"] },
      minWidth: 140,
    },
    {
      headerName: "YUYV Spreadsheet Updated?",
      field: "YUYVSpreadsheetUpdated",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["YES", "NO"] },
      minWidth: 210,
    },

    { headerName: "Employee ID", field: "EmployeeID", minWidth: 130 },
    { headerName: "Group 25201553", field: "Group25201553", minWidth: 150 },
    { headerName: "Project/Role", field: "ProjectRole", minWidth: 180 },
    { headerName: "First Day FO", field: "FirstDayFO", valueFormatter: ({ value }) => toMDY(value), minWidth: 140 },
    { headerName: "Prj. Start", field: "PrjStart", valueFormatter: ({ value }) => toMDY(value), minWidth: 130 },
    { headerName: "Current PO End", field: "CurrentPOEnd", valueFormatter: ({ value }) => toMDY(value), minWidth: 150 },
    { headerName: "Supplier", field: "Supplier", minWidth: 140 },
    { headerName: "Last Day FO (Term in PP)", field: "LastDayFO", valueFormatter: ({ value }) => toMDY(value), minWidth: 220 },
    { headerName: "Current Project", field: "CurrentProject", minWidth: 170 },

    { headerName: "Hrly Bill Rate", field: "HrlyBillRate", type: "numericColumn", minWidth: 140 },
    { headerName: "Pay Reviewed Date", field: "PayReviewedDate", valueFormatter: ({ value }) => toMDY(value), minWidth: 170 },
    { headerName: "Projected Prj End", field: "ProjectedPrjEnd", valueFormatter: ({ value }) => toMDY(value), minWidth: 170 },

    {
      headerName: "N?",
      field: "N",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: ["YES", "NO"] },
      width: 90,
    },

    { headerName: "18 Month date", field: "EighteenMonthDate", valueFormatter: ({ value }) => toMDY(value), minWidth: 150 },
    { headerName: "Current PO Balance", field: "CurrentPOBalance", type: "numericColumn", minWidth: 170 },
    { headerName: "Billed Thru…", field: "BilledThru", valueFormatter: ({ value }) => toMDY(value), minWidth: 140 },
    { headerName: "Wks remaininig", field: "WksRemaining", type: "numericColumn", minWidth: 150 },
    { headerName: "PO Hrly Bill Rate", field: "POHrlyBillRate", type: "numericColumn", minWidth: 170 },
    { headerName: "Weekly rate", field: "WeeklyRate", type: "numericColumn", minWidth: 140 },
    { headerName: "GL", field: "GL", minWidth: 120 },
    { headerName: "GTL", field: "GTL", minWidth: 120 },

    // Actions (copy/delete)
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
            // 1) read latest
            const source = await doGetDoc(p.data.id);
            // 2) strip db keys and tweak
            const { _id, _rev, ...rest } = source || {};
            const payload = {
              ...rest,
              CurrentProject: rest.CurrentProject
                ? `${rest.CurrentProject} (copy)`
                : "(copy)",
            };
            // 3) create new
            const r = await fetch(`${API_BASE}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!r.ok) throw new Error(`Copy failed: ${r.status}`);
            const saved = await r.json();
            const newRow = docToRow(saved);
            // 4) show on top
            setRows((prev) => [newRow, ...prev]);
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
              onClick={() => {
                setRowToDelete(p.data);      // store selected row
                setShowDeleteDialog(true);   // open modal
              }}
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

  // Modal form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());

  //Delete confirmation dialog
 const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [rowToDelete, setRowToDelete] = useState(null);

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

  // Live create
  const saveRow = async () => {
    try {
      const payload = { ...form };
      const r = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`Create failed: ${r.status}`);
      const saved = await r.json();
      const newRow = docToRow(saved);
      setRows((prev) => [newRow, ...prev]); // show on top
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Create failed.");
    }
  };

  // Live inline update
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
              <h3 style={{ margin: 0 }}>Add New Row</h3>
              <button className="btn btn-ghost" onClick={closeForm} aria-label="Close">✕</button>
            </div>

            <div className="grid2">
              <label><div>Supplier Point of Contact</div><input name="SupplierPointOfContact" value={form.SupplierPointOfContact} onChange={onField} /></label>
              <label><div>Last Name</div><input name="LastName" value={form.LastName} onChange={onField} /></label>
              <label><div>ASML Acronym</div><input name="ASMLAcronym" value={form.ASMLAcronym} onChange={onField} /></label>
              <label><div>DPOC Start Date</div><input name="DPOCStartDate" value={form.DPOCStartDate} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>People Portal Status</div><input name="PeoplePortalStatus" value={form.PeoplePortalStatus} onChange={onField} /></label>

              <label><div>LT Ordered?</div>
                <select name="LTOrdered" value={form.LTOrdered} onChange={onField}>
                  <option value="NO">NO</option><option value="YES">YES</option>
                </select>
              </label>
              <label><div>Update FO DLs</div>
                <select name="UpdateFODLs" value={form.UpdateFODLs} onChange={onField}>
                  <option value="NO">NO</option><option value="YES">YES</option>
                </select>
              </label>
              <label><div>YUYV Spreadsheet Updated?</div>
                <select name="YUYVSpreadsheetUpdated" value={form.YUYVSpreadsheetUpdated} onChange={onField}>
                  <option value="NO">NO</option><option value="YES">YES</option>
                </select>
              </label>

              <label><div>Employee ID</div><input name="EmployeeID" value={form.EmployeeID} onChange={onField} /></label>
              <label><div>Group 25201553</div><input name="Group25201553" value={form.Group25201553} onChange={onField} /></label>
              <label><div>Project/Role</div><input name="ProjectRole" value={form.ProjectRole} onChange={onField} /></label>
              <label><div>First Day FO</div><input name="FirstDayFO" value={form.FirstDayFO} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Prj. Start</div><input name="PrjStart" value={form.PrjStart} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Current PO End</div><input name="CurrentPOEnd" value={form.CurrentPOEnd} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Supplier</div><input name="Supplier" value={form.Supplier} onChange={onField} /></label>
              <label><div>Last Day FO (Term in PP)</div><input name="LastDayFO" value={form.LastDayFO} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Current Project</div><input name="CurrentProject" value={form.CurrentProject} onChange={onField} /></label>

              <label><div>Hrly Bill Rate</div><input type="number" name="HrlyBillRate" value={form.HrlyBillRate} onChange={onNumber} /></label>
              <label><div>Pay Reviewed Date</div><input name="PayReviewedDate" value={form.PayReviewedDate} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Projected Prj End</div><input name="ProjectedPrjEnd" value={form.ProjectedPrjEnd} onChange={onField} placeholder="MM/DD/YYYY" /></label>

              <label><div>N?</div>
                <select name="N" value={form.N} onChange={onField}>
                  <option value="NO">NO</option><option value="YES">YES</option>
                </select>
              </label>

              <label><div>18 Month date</div><input name="EighteenMonthDate" value={form.EighteenMonthDate} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Current PO Balance</div><input type="number" name="CurrentPOBalance" value={form.CurrentPOBalance} onChange={onNumber} /></label>
              <label><div>Billed Thru…</div><input name="BilledThru" value={form.BilledThru} onChange={onField} placeholder="MM/DD/YYYY" /></label>
              <label><div>Wks remaininig</div><input type="number" name="WksRemaining" value={form.WksRemaining} onChange={onNumber} /></label>
              <label><div>PO Hrly Bill Rate</div><input type="number" name="POHrlyBillRate" value={form.POHrlyBillRate} onChange={onNumber} /></label>
              <label><div>Weekly rate</div><input type="number" name="WeeklyRate" value={form.WeeklyRate} onChange={onNumber} /></label>
              <label><div>GL</div><input name="GL" value={form.GL} onChange={onField} /></label>
              <label><div>GTL</div><input name="GTL" value={form.GTL} onChange={onField} /></label>
            </div>

            <div className="modal-actions">
              <div style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={saveRow}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
  <div className="modal-backdrop" onClick={() => setShowDeleteDialog(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0 }}>Confirm Delete</h3>
        <button className="btn btn-ghost" onClick={() => setShowDeleteDialog(false)}>✕</button>
      </div>

      <div style={{ padding: '12px 0' }}>
        Are you sure you want to delete <strong>{rowToDelete?.SupplierPointOfContact || "this row"}</strong>?
      </div>

      <div className="modal-actions">
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={async () => {
            try {
              const g = await fetch(`${API_BASE}/items/${encodeURIComponent(rowToDelete.id)}`);
              const doc = await g.json();
              const rev = doc._rev;
              const r = await fetch(
                `${API_BASE}/items/${encodeURIComponent(rowToDelete.id)}?rev=${encodeURIComponent(rev)}`,
                { method: "DELETE" }
              );
              if (!r.ok) throw new Error("Delete failed");
              setRows((prev) => prev.filter((x) => x.id !== rowToDelete.id));
              setShowDeleteDialog(false);
            } catch (err) {
              console.error(err);
              alert("Failed to delete row.");
              setShowDeleteDialog(false);
            }
          }}
        >
          Confirm Delete
        </button>
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
          // (no rowClassRules here; your new schema doesn’t have PRStatus)
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
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
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

        body.modal-open { overflow: hidden; 
        .modal-backdrop {
         z-index: 10000;
        }

        .modal {
          z-index: 10001;
        }
        }
      `}</style>
    </div>
  );
};
export default PeopleGrid;



