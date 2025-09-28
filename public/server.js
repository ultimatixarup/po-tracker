// server.js (Node 16 compatible, multi-DB per request, excludes design docs by default)
// - List endpoints filter out _design/* and deleted docs unless ?include_design=true
// - Adds joined People API: /db/:peopleDb/people_with_po[/:id]?poDb=po_db&joinKey=pr|po

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const crypto = require("crypto");

const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-find"));

// ---- Config ----
const DEFAULT_DB = process.env.DB_NAME || "myitems";
const PORT = process.env.PORT || 5902;

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));
app.use(morgan("dev"));

// ---- Helpers ----

// Simple ID generator (base62-ish) – avoids ESM-only nanoid
function genId(size) {
  size = size || 21;
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function httpError(res, status, message, details) {
  return res
    .status(status)
    .json({
      error: message,
      details: details && details.message ? details.message : details
    });
}

// Validate/sanitize db name to avoid fs shenanigans
function sanitizeDbName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  // Allow letters, numbers, dot, underscore, dash. Limit length.
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(trimmed)) return null;
  return trimmed;
}

// Small helper: include design docs?
function wantIncludeDesign(req) {
  const v = (req.query && String(req.query.include_design).toLowerCase()) || "false";
  return v === "true" || v === "1" || v === "yes";
}

// Filter out design & deleted docs
function filterOutDesignAndDeleted(docs, includeDesign) {
  return (docs || []).filter((d) => {
    if (!d) return false;
    if (!includeDesign && typeof d._id === "string" && d._id.startsWith("_design/")) return false;
    if (d._deleted) return false;
    return true;
  });
}

// Cache PouchDB instances per db name
const dbCache = Object.create(null);

async function ensureIndexes(db) {
  try {
    await db.createIndex({ index: { fields: ["type"] } });
  } catch (e) {
    console.warn("Index(type) creation failed:", e && e.message);
  }
  try {
    await db.createIndex({ index: { fields: ["role"] } });
  } catch (e) {
    console.warn("Index(role) creation failed:", e && e.message);
  }
}

function getDBOrThrow(rawName) {
  const safe = sanitizeDbName(rawName || DEFAULT_DB);
  if (!safe) throw new Error("Invalid database name");
  if (!dbCache[safe]) {
    const instance = new PouchDB("./data-" + safe);
    // lazy per-DB index creation
    ensureIndexes(instance).catch((e) =>
      console.warn("ensureIndexes failed for", safe, "-", e && e.message)
    );
    dbCache[safe] = instance;
  }
  return { db: dbCache[safe], dbName: safe };
}

// Middleware that attaches req.db based on either /db/:db or ?db=
function bindDbFromRequest(req, res, next) {
  try {
    const rawName = req.params.db || req.query.db || DEFAULT_DB;
    const { db, dbName } = getDBOrThrow(rawName);
    req.db = db;
    req.dbName = dbName;
    next();
  } catch (e) {
    return httpError(res, 400, "Invalid or missing database name", e);
  }
}

// ----- Health checks -----
app.get("/health", (req, res) => {
  // Generic health; doesn’t touch a DB
  res.json({ ok: true, defaultDb: DEFAULT_DB });
});

// Per-DB health (path style: /db/:db/health OR query style: /health-db?db=foo)
app.get("/db/:db/health", bindDbFromRequest, (req, res) => {
  res.json({ ok: true, db: req.dbName });
});
app.get("/health-db", bindDbFromRequest, (req, res) => {
  res.json({ ok: true, db: req.dbName });
});

// ----- Router that requires a db -----
const router = express.Router({ mergeParams: true });

// Create
router.post("/items", async (req, res) => {
  const db = req.db;
  try {
    const doc = req.body || {};
    if (!doc._id) doc._id = genId();
    const putRes = await db.put(doc);
    const saved = await db.get(putRes.id);
    res.status(201).json(saved);
  } catch (err) {
    if (err && err.status === 409)
      return httpError(res, 409, "Document with this _id already exists", err);
    return httpError(res, 400, "Failed to create document", err);
  }
});

// Read one
router.get("/items/:id", async (req, res) => {
  const db = req.db;
  try {
    const doc = await db.get(req.params.id);
    if (!wantIncludeDesign(req) && typeof doc._id === "string" && doc._id.startsWith("_design/")) {
      return httpError(res, 404, "Not found");
    }
    res.json(doc);
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    return httpError(res, 400, "Failed to read", err);
  }
});

// Replace (full update) – requires _rev
router.put("/items/:id", async (req, res) => {
  const db = req.db;
  try {
    const incoming = req.body || {};
    if (!incoming._rev)
      return httpError(res, 409, "Missing _rev for update (optimistic concurrency)");
    incoming._id = req.params.id;
    const putRes = await db.put(incoming);
    const saved = await db.get(putRes.id);
    res.json(saved);
  } catch (err) {
    if (err && err.status === 409) return httpError(res, 409, "Conflict: stale _rev", err);
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    return httpError(res, 400, "Failed to update", err);
  }
});

// Patch (partial update)
router.patch("/items/:id", async (req, res) => {
  const db = req.db;
  try {
    const current = await db.get(req.params.id);
    const merged = Object.assign({}, current, req.body, {
      _id: current._id,
      _rev: current._rev
    });
    const putRes = await db.put(merged);
    const saved = await db.get(putRes.id);
    res.json(saved);
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    if (err && err.status === 409) return httpError(res, 409, "Conflict during patch", err);
    return httpError(res, 400, "Failed to patch", err);
  }
});

// Delete – requires latest _rev (?rev= or body._rev)
router.delete("/items/:id", async (req, res) => {
  const db = req.db;
  try {
    const rev = (req.query && req.query.rev) || (req.body && req.body._rev);
    if (!rev) return httpError(res, 409, "Missing _rev for delete");
    const delRes = await db.remove(req.params.id, rev);
    res.json({ ok: true, id: delRes.id, rev: delRes.rev });
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    if (err && err.status === 409) return httpError(res, 409, "Conflict: stale _rev", err);
    return httpError(res, 400, "Failed to delete", err);
  }
});

// List (with pagination) — excludes _design/* & deleted by default
router.get("/items", async (req, res) => {
  const db = req.db;
  const includeDesign = wantIncludeDesign(req);
  try {
    const limit = Math.min(parseInt((req.query && req.query.limit) || "25", 10), 500);
    const skip = parseInt((req.query && req.query.skip) || "0", 10);
    const result = await db.allDocs({ include_docs: true, limit, skip });
    const docs = filterOutDesignAndDeleted(result.rows.map((r) => r.doc), includeDesign);
    res.json({
      total: docs.length,
      offset: skip,
      include_design: !!includeDesign,
      rows: docs
    });
  } catch (err) {
    return httpError(res, 400, "Failed to list", err);
  }
});

// Mango query (design docs won't match unless explicitly selected)
router.post("/items/_find", async (req, res) => {
  const db = req.db;
  try {
    const payload = req.body || {};
    const selector = payload.selector || {};
    const limit = payload.limit || 25;
    const skip = payload.skip || 0;
    const sort = payload.sort;
    const result = await db.find({ selector, limit, skip, sort });
    res.json(result.docs);
  } catch (err) {
    return httpError(res, 400, "Query failed", err);
  }
});

// Bulk insert/update
router.post("/items/_bulk", async (req, res) => {
  const db = req.db;
  try {
    const docs = Array.isArray(req.body) ? req.body : [];
    const mapped = docs.map((d) => Object.assign({ _id: d._id || genId() }, d));
    const resp = await db.bulkDocs(mapped);
    res.json(resp);
  } catch (err) {
    return httpError(res, 400, "Bulk operation failed", err);
  }
});

// ======= JOIN HELPERS (People ↔ PO) =======

// Given a people doc and an optional PO doc, copy the desired PO fields
// into the returned object WITHOUT mutating DB data (computed view only).
function mergePersonWithPo(personDoc, poDoc) {
  const out = { ...personDoc };

  if (poDoc) {
    const map = {
      FirstDayFO: poDoc.POProjectStart,     // First day fo = PO Project Start
      PrjStart: poDoc.POProjectStart,       // Prj Start   = PO Project Start
      CurrentPOEnd: poDoc.ProjectEnd,       // Current PO End = Project End
      Supplier: poDoc.Supplier,             // Supplier
      LastDayFO: poDoc.ProjectEnd,          // Last day FO = Project End
      CurrentProject: poDoc.Project,        // Currenct Project (sic)
      HrlyBillRate: poDoc.PRHrlyBillRate,   // Hrly Bill Rate = PR Hrly Bill Rate
      N: poDoc.FONType                      // N? = FO N-Type
    };

    for (const [k, v] of Object.entries(map)) {
      if (v !== undefined && v !== null && v !== "") out[k] = v;
    }
  }

  return out;
}

// Build a map of joinKeyValue → PO doc via Mango ($in)
async function buildPoMapByKey(poDb, keyName, keyValues) {
  const list = Array.from(
    new Set(
      (keyValues || [])
        .map(v => (v == null ? "" : String(v).trim()))
        .filter(Boolean)
    )
  );
  if (list.length === 0) return {};

  // Choose correct selector field in PO DB
  const selectorField = keyName === "po" ? "PO" : "PRNumber";

  const result = await poDb.find({
    selector: { [selectorField]: { $in: list } },
    limit: Math.max(500, list.length)
  });

  const map = {};
  for (const d of result.docs || []) {
    const k = String(d[selectorField] || "").trim();
    if (k) map[k] = d;
  }
  return map;
}

// Pull the "join value" from a person doc, depending on joinKey
function extractJoinValueFromPerson(person, joinKey) {
  if (joinKey === "po") {
    return person.CurrentProject || person.PO || "";
  }
  // default: PR-based join
  return person.PR || person.PRNumber || "";
}

// ======= PEOPLE WITH PO: LIST =======
// GET /db/:peopleDb/people_with_po?poDb=po_db&joinKey=pr|po&limit=...&skip=...&include_design=true|false
router.get("/people_with_po", async (req, res) => {
  const peopleDb = req.db;
  const includeDesign = wantIncludeDesign(req);

  // Which PO DB to use and how to join
  const poDbName = sanitizeDbName(req.query.poDb || "po_db");
  const joinKey = (req.query.joinKey || "pr").toLowerCase(); // "pr" | "po"

  let poDb;
  try {
    poDb = getDBOrThrow(poDbName).db;
  } catch (e) {
    return httpError(res, 400, "Invalid PO database name", e);
  }

  try {
    const limit = Math.min(parseInt((req.query && req.query.limit) || "100", 10), 500);
    const skip = parseInt((req.query && req.query.skip) || "0", 10);

    // Load people
    const result = await peopleDb.allDocs({ include_docs: true, limit, skip });
    const peopleDocs = filterOutDesignAndDeleted(result.rows.map((r) => r.doc), includeDesign);

    // Build join keys
    const joinValues = peopleDocs.map(p => extractJoinValueFromPerson(p, joinKey));

    // Build PO map
    const poMap = await buildPoMapByKey(poDb, joinKey, joinValues);

    // Merge
    const merged = peopleDocs.map(p => {
      const key = extractJoinValueFromPerson(p, joinKey);
      const po = key ? poMap[key] : undefined;
      return mergePersonWithPo(p, po);
    });

    res.json({
      total: merged.length,
      offset: skip,
      joinKey: joinKey,
      poDb: poDbName,
      include_design: !!includeDesign,
      rows: merged
    });
  } catch (err) {
    return httpError(res, 400, "Failed to list people_with_po", err);
  }
});

// ======= PEOPLE WITH PO: SINGLE =======
// GET /db/:peopleDb/people_with_po/:id?poDb=po_db&joinKey=pr|po&include_design=true|false
router.get("/people_with_po/:id", async (req, res) => {
  const peopleDb = req.db;
  const includeDesign = wantIncludeDesign(req);

  const poDbName = sanitizeDbName(req.query.poDb || "po_db");
  const joinKey = (req.query.joinKey || "pr").toLowerCase(); // "pr" | "po"

  let poDb;
  try {
    poDb = getDBOrThrow(poDbName).db;
  } catch (e) {
    return httpError(res, 400, "Invalid PO database name", e);
  }

  try {
    const person = await peopleDb.get(req.params.id);
    if (!includeDesign && (person._id || "").startsWith("_design/")) {
      return httpError(res, 404, "Not found");
    }

    const joinValue = extractJoinValueFromPerson(person, joinKey);
    let poDoc = null;
    if (joinValue) {
      const selectorField = joinKey === "po" ? "PO" : "PRNumber";
      const found = await poDb.find({ selector: { [selectorField]: joinValue }, limit: 1 });
      poDoc = Array.isArray(found.docs) && found.docs[0] ? found.docs[0] : null;
    }

    const merged = mergePersonWithPo(person, poDoc);
    res.json({ joinKey, poDb: poDbName, row: merged });
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    return httpError(res, 400, "Failed to read people_with_po", err);
  }
});

// --- Mount router with both styles: path param and query param ---

// Preferred RESTful path style: /db/:db/...
app.use("/db/:db", bindDbFromRequest, router);

// Convenience/back-compat query style: /... ?db=myDb
app.use("/", bindDbFromRequest, router);

// Global error guard
app.use(function (err, _req, res, _next) {
  console.error(err);
  return httpError(res, 500, "Unexpected server error", err);
});

app.listen(PORT, function () {
  console.log(
    `PouchDB REST API listening on http://localhost:${PORT}\n` +
    `- default DB: ${DEFAULT_DB}\n` +
    `- usage (path):   GET /db/{db}/items\n` +
    `- usage (query):  GET /items?db={db}\n` +
    `- people+po list: GET /db/{peopleDb}/people_with_po?poDb=po_db&joinKey=pr\n` +
    `- people+po one:  GET /db/{peopleDb}/people_with_po/{id}?poDb=po_db\n`
  );
});
