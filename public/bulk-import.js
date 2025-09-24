const fs = require("fs");
const fetch = require("node-fetch");

const API = process.env.API || "http://localhost:5902/db/po_db/items/_bulk";

function moneyToNumber(s) {
  if (s == null) return 0;
  return Number(String(s).replace(/[,$\s]/g, "")) || 0;
}

function mapRow(cols) {
  return {
    DeliverablePOCOrASMLAcronym: cols[0] || "",
    FONType: cols[1] || "",
    Supplier: cols[2] || "",
    Group: cols[3] || "",
    Project: cols[4] || "",
    Program: cols[5] || "",
    PBS: cols[6] || "",
    WBS: cols[7] || "",
    PCM: cols[8] || "",
    PL: cols[9] || "",
    GL: cols[10] || "",
    GTL: cols[11] || "",
    FOProjectName: cols[12] || "",
    POProjectStart: cols[13] || "",
    WkStart: cols[14] ? Number(cols[14]) : "",
    ProjectEnd: cols[15] || "",
    WkEnd: cols[16] ? Number(cols[16]) : "",
    PRNumber: cols[17] || "",
    PRStatus: cols[18] || "TBD",
    PO: cols[19] || "",
    POManWks: cols[20] ? Number(cols[20]) : 0,
    PRAmount: moneyToNumber(cols[21]),
    PRWklyRate: moneyToNumber(cols[22]),
    PRHrlyBillRate: moneyToNumber(cols[23]),
  };
}

(async () => {
  const raw = fs.readFileSync("rows.tsv", "utf8").trim();
  const docs = raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split("\t"))
    .map(mapRow);

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docs),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Bulk import failed:", res.status, txt);
    process.exit(1);
  }
  const out = await res.json();
  console.log("Imported:", out);
})();
