// ExcelUpload.jsx
"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";

// ---------- Config ----------
const ORIGIN = import.meta.env?.VITE_API_BASE || "http://localhost:5902";
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// ---------- Parsing helpers ----------
const numFromMoney = (v) => {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const toMDY = (v) => {
  try {
    if (v == null || v === "") return "";
    if (v instanceof Date && !isNaN(v)) {
      const mm = String(v.getMonth() + 1).padStart(2, "0");
      const dd = String(v.getDate()).padStart(2, "0");
      return `${mm}/${dd}/${v.getFullYear()}`;
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      // Excel serial -> UTC
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(epoch.getTime() + v * 86400000);
      if (!isNaN(d)) {
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        return `${mm}/${dd}/${d.getUTCFullYear()}`;
      }
    }
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const [y, m, d] = s.slice(0, 10).split("-").map(Number);
      return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
    }
    const d2 = new Date(s);
    if (!isNaN(d2)) {
      const mm = String(d2.getMonth() + 1).padStart(2, "0");
      const dd = String(d2.getDate()).padStart(2, "0");
      return `${mm}/${dd}/${d2.getFullYear()}`;
    }
    return s;
  } catch {
    return String(v ?? "");
  }
};

const yn = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return ["y", "yes", "true", "1", "x"].includes(s) ? "YES" : "NO";
};

// ==========================================================
//                         PO IMPORT
// ==========================================================
const PO_DEFAULT = {
  DeliverablePointOfContactOrASMLAcronym: "",
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

  POProjectStart: "",
  wkStart: "",
  ProjectEnd: "",
  wkEnd: "",

  PRNumber: "",
  PRStatus: "TBD",
  PO: "",
  POManWks: 0,
  PRAmount: 0,
  PRWklyRate: 0,
  PRHrlyBillRate: 0,
};

// Header aliases -> PO field
const PO_ALIASES = {
  "deliverable point of contact or asml acronym":
    "DeliverablePointOfContactOrASMLAcronym",
  "deliverable point of contact": "DeliverablePointOfContactOrASMLAcronym",
  "asml acronym": "DeliverablePointOfContactOrASMLAcronym",
  resource: "DeliverablePointOfContactOrASMLAcronym",
  "resource name": "DeliverablePointOfContactOrASMLAcronym",

  "fo n type": "FONType",
  "fo ntype": "FONType",
  "fo n-type": "FONType",

  supplier: "Supplier",
  "group sdev cdev": "GroupType",
  group: "GroupType",
  project: "Project",
  program: "Program",
  pbs: "PBS",

  wbs: "WBS",
  pcm: "PCM",
  pl: "PL",
  gl: "GL",
  gtl: "GTL",

  "fo project name project group description yyqq fo": "FOProjectName",
  "fo project name": "FOProjectName",

  "po project start": "POProjectStart",
  wkstart: "wkStart",
  "wk start": "wkStart",
  "project end": "ProjectEnd",
  wkend: "wkEnd",
  "wk end": "wkEnd",

  "pr number": "PRNumber",
  "pr status": "PRStatus",
  "pr status tbd pending quote submitted approved receiving fully received expired cancelled":
    "PRStatus",

  "po pending": "PO",
  po: "PO",

  "po man wks": "POManWks",
  "pr amount": "PRAmount",
  "pr wkly rate": "PRWklyRate",
  "pr hourly bill rate": "PRHrlyBillRate",
  "pr hrly bill rate": "PRHrlyBillRate",
};

const PO_MONEY = new Set(["PRAmount", "PRWklyRate", "PRHrlyBillRate"]);
const PO_NUMERIC = new Set(["POManWks"]);
const PO_DATE = new Set(["POProjectStart", "wkStart", "ProjectEnd", "wkEnd"]);

const mapPOHeaders = (hdr) => {
  const m = {};
  hdr.forEach((h, i) => {
    const key = PO_ALIASES[norm(h)];
    if (key) m[i] = key;
  });
  return m;
};

const transformPO = (rows, headerIndex, excludeHeader) => {
  const hdr = rows[headerIndex] || [];
  const map = mapPOHeaders(hdr);
  const start = excludeHeader ? headerIndex + 1 : headerIndex;
  const out = [];

  for (let r = start; r < rows.length; r++) {
    const row = rows[r] || [];
    const rec = { ...PO_DEFAULT };

    for (let c = 0; c < row.length; c++) {
      const f = map[c];
      if (!f) continue;
      const v = row[c];

      if (PO_MONEY.has(f)) rec[f] = numFromMoney(v);
      else if (PO_NUMERIC.has(f)) {
        const n =
          typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
        rec[f] = Number.isFinite(n) ? n : 0;
      } else if (PO_DATE.has(f)) rec[f] = toMDY(v);
      else if (f === "PRStatus") {
        const up = String(v || "").trim().toUpperCase();
        rec[f] =
          [
            "TBD",
            "PENDING QUOTE",
            "SUBMITTED",
            "APPROVED",
            "RECEIVING",
            "FULLY RECEIVED",
            "EXPIRED",
            "CANCELLED",
            "OPEN",
            "CLOSED",
          ].includes(up) ? up : PO_DEFAULT.PRStatus;
      } else rec[f] = String(v ?? "").trim();
    }

    // keep non-empty rows only
    if (
      rec.DeliverablePointOfContactOrASMLAcronym ||
      rec.PO ||
      rec.PRNumber ||
      rec.FOProjectName
    )
      out.push(rec);
  }
  return out;
};

// ==========================================================
//                       PEOPLE IMPORT
// ==========================================================
const PEOPLE_DEFAULT = {
  SupplierPointOfContact: "",
  LastName: "",
  ASMLAcronym: "",
  DPOCStartDate: "",
  PeoplePortalStatus: "",
  LTOrdered: "NO",
  UpdateFODLs: "NO",
  YUYVSpreadsheetUpdated: "NO",
  EmployeeID: "",
  Group25201553: "",
  ProjectRole: "",
  FirstDayFO: "",
  PrjStart: "",
  LastDayFO: "",
  N: "NO",
  EighteenMonthDate: "",
  BilledThru: "",
  WksRemaining: 0,

  // join key to PO
  PR: "",
  // optional user-maintained PO ref (not used for join)
  CurrentProject: "",

  // optional numbers if present in sheet
  HrlyBillRate: 0,
  POHrlyBillRate: 0,
  WeeklyRate: 0,
  CurrentPOBalance: 0,

  // optional strings if present
  GL: "",
  GTL: "",
  Supplier: "",
};

const PEOPLE_ALIASES = {
  "supplier point of contact": "SupplierPointOfContact",
  "deliverable point of contact": "SupplierPointOfContact",
  "deliverable poc": "SupplierPointOfContact",
  "first name": "SupplierPointOfContact", // if they give single name, still capture
  "resource": "SupplierPointOfContact",
  "resource name": "SupplierPointOfContact",

  "last name": "LastName",
  "asml acronym": "ASMLAcronym",

  "dpoc start date": "DPOCStartDate",
  "people portal status": "PeoplePortalStatus",

  "lt ordered": "LTOrdered",
  "lt ordered?": "LTOrdered",
  "update fo dls": "UpdateFODLs",
  "yuyv spreadsheet updated": "YUYVSpreadsheetUpdated",
  "yuyv spreadsheet updated?": "YUYVSpreadsheetUpdated",

  "employee id": "EmployeeID",
  "group 25201553": "Group25201553",
  group: "Group25201553",

  "project role": "ProjectRole",
  "project/role": "ProjectRole",

  "first day fo": "FirstDayFO",
  "prj start": "PrjStart",
  "project start": "PrjStart",

  "last day fo": "LastDayFO",
  "last day fo (term in pp)": "LastDayFO",

  "n?": "N",
  n: "N",

  "18 month date": "EighteenMonthDate",
  "18 month": "EighteenMonthDate",

  "billed thru…": "BilledThru",
  "billed thru": "BilledThru",

  "wks remaining": "WksRemaining",
  "wks remaininig": "WksRemaining",

  pr: "PR",
  "current project": "CurrentProject",
  "po": "CurrentProject", // allow PO to land here if present in people sheet

  // optional numeric money-ish fields
  "hrly bill rate": "HrlyBillRate",
  "po hrly bill rate": "POHrlyBillRate",
  "weekly rate": "WeeklyRate",
  "current po balance": "CurrentPOBalance",

  gl: "GL",
  gtl: "GTL",
  supplier: "Supplier",
};

const PEOPLE_DATE = new Set([
  "DPOCStartDate",
  "FirstDayFO",
  "PrjStart",
  "LastDayFO",
  "EighteenMonthDate",
  "BilledThru",
]);

const PEOPLE_NUMERIC = new Set(["WksRemaining"]);
const PEOPLE_MONEY = new Set([
  "HrlyBillRate",
  "POHrlyBillRate",
  "WeeklyRate",
  "CurrentPOBalance",
]);

const mapPeopleHeaders = (hdr) => {
  const m = {};
  hdr.forEach((h, i) => {
    const key = PEOPLE_ALIASES[norm(h)];
    if (key) m[i] = key;
  });
  return m;
};

const transformPeople = (rows, headerIndex, excludeHeader) => {
  const hdr = rows[headerIndex] || [];
  const map = mapPeopleHeaders(hdr);
  const start = excludeHeader ? headerIndex + 1 : headerIndex;
  const out = [];

  for (let r = start; r < rows.length; r++) {
    const row = rows[r] || [];
    const rec = { ...PEOPLE_DEFAULT };

    for (let c = 0; c < row.length; c++) {
      const f = map[c];
      if (!f) continue;
      const v = row[c];

      if (PEOPLE_DATE.has(f)) rec[f] = toMDY(v);
      else if (PEOPLE_NUMERIC.has(f)) {
        const n =
          typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
        rec[f] = Number.isFinite(n) ? n : 0;
      } else if (PEOPLE_MONEY.has(f)) rec[f] = numFromMoney(v);
      else if (f === "LTOrdered" || f === "UpdateFODLs" || f === "YUYVSpreadsheetUpdated" || f === "N") {
        rec[f] = yn(v);
      } else rec[f] = String(v ?? "").trim();
    }

    // Keep rows with at least a name or a PR key
    if (rec.SupplierPointOfContact || rec.PR || rec.EmployeeID) out.push(rec);
  }
  return out;
};

// ==========================================================
//                      Component UI
// ==========================================================
export default function ExcelUpload({ apiBase }) {
  const BASE = apiBase || ORIGIN;
  const [book, setBook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetName, setSheetName] = useState("");
  const [headerRow, setHeaderRow] = useState(1);
  const [excludeHeader, setExcludeHeader] = useState(true);
  const [target, setTarget] = useState("po"); // po | people
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState("");

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus("");
    setPreview([]);
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    setBook(wb);
    const names = wb.SheetNames || [];
    setSheetNames(names);
    const preferred =
      names.find((n) => n.toLowerCase() === target) ||
      names.find((n) => n.toLowerCase().includes(target)) ||
      names[0] ||
      "";
    setSheetName(preferred);
  };

  const rowsFromSheet = () => {
    if (!book || !sheetName) return [];
    const ws = book.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  };

  const doPreview = () => {
    const rows = rowsFromSheet();
    if (!rows.length) {
      setStatus("No rows in selected sheet.");
      setPreview([]);
      return;
    }
    const hdrIdx = Math.max(0, (headerRow | 0) - 1);
    if (target === "po") {
      const data = transformPO(rows, hdrIdx, excludeHeader);
      setPreview(data.slice(0, 10));
      setStatus(`Previewing ${Math.min(10, data.length)} of ${data.length} PO rows.`);
    } else {
      const data = transformPeople(rows, hdrIdx, excludeHeader);
      setPreview(data.slice(0, 10));
      setStatus(`Previewing ${Math.min(10, data.length)} of ${data.length} People rows.`);
    }
  };

  const doImport = async () => {
    try {
      const rows = rowsFromSheet();
      if (!rows.length) {
        setStatus("Nothing to import.");
        return;
      }
      const hdrIdx = Math.max(0, (headerRow | 0) - 1);

      if (target === "po") {
        const docs = transformPO(rows, hdrIdx, excludeHeader);
        if (!docs.length) {
          setStatus("No PO rows to import after mapping.");
          return;
        }
        const resp = await fetch(`${BASE}/db/po_db/items/_bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(docs),
        });
        if (!resp.ok) throw new Error(`PO import failed: HTTP ${resp.status}`);
        setStatus(`Imported ${docs.length} PO records.`);
      } else {
        const docs = transformPeople(rows, hdrIdx, excludeHeader);
        if (!docs.length) {
          setStatus("No People rows to import after mapping.");
          return;
        }
        const resp = await fetch(`${BASE}/db/people_db/items/_bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(docs),
        });
        if (!resp.ok) throw new Error(`People import failed: HTTP ${resp.status}`);
        setStatus(`Imported ${docs.length} People records.`);
      }
    } catch (e) {
      console.error(e);
      setStatus(String(e?.message || e));
    }
  };

  const hasBook = !!book && sheetNames.length > 0;

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Excel Import</h3>

      <div className="row">
        <label className="label">Excel file</label>
        <input type="file" accept=".xlsx,.xls" onChange={onFile} />
      </div>

      <div className="row">
        <label className="label">Target table</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="po">PO (mapped)</option>
          <option value="people">People (mapped)</option>
        </select>
      </div>

      <div className="row">
        <label className="label">Sheet (tab)</label>
        <select
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          disabled={!hasBook}
        >
          {sheetNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <label className="label">Header row (1-based)</label>
        <input
          type="number"
          min={1}
          value={headerRow}
          onChange={(e) => setHeaderRow(e.target.value)}
          style={{ width: 100 }}
        />
        <label style={{ marginLeft: 12 }}>
          <input
            type="checkbox"
            checked={excludeHeader}
            onChange={(e) => setExcludeHeader(e.target.checked)}
          />{" "}
          Exclude header row from data
        </label>
      </div>

      <div className="row" style={{ gap: 8 }}>
        <button className="btn" onClick={doPreview} disabled={!hasBook}>
          Preview
        </button>
        <button className="btn btn-primary" onClick={doImport} disabled={!hasBook}>
          Import
        </button>
        <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.75 }}>{status}</span>
      </div>

      {!!preview.length && (
        <div className="preview">
          <pre>{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}

      <style>{`
        .row { display:flex; align-items:center; gap:8px; margin:8px 0; }
        .label { width: 160px; font-size: 13px; color: #4c596b; }
        .btn {
          appearance: none;
          border: 1px solid rgba(0,0,0,0.1);
          background: #fff;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform .05s, box-shadow .15s, background .2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,0.10); }
        .btn-primary { background: #0e4491; color: #fff; border-color: transparent; }
        .preview {
          margin-top: 10px;
          padding: 10px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          max-height: 320px; overflow: auto;
        }
      `}</style>
    </div>
  );
}
