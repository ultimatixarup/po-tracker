// server.js (Node 16 compatible, multi-DB per request)

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const crypto = require("crypto");

const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-find"));

// ---- Config ----
const DEFAULT_DB = process.env.DB_NAME || "myitems";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
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
    .json({ error: message, details: details && details.message ? details.message : details });
}

// Validate/sanitize db name to avoid fs shenanigans
function sanitizeDbName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  // Allow letters, numbers, dot, underscore, dash. Limit length.
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(trimmed)) return null;
  return trimmed;
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

// Per-DB health (path style: /db/:db/health OR query style: /health?db=foo)
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
    if (err && err.status === 409) return httpError(res, 409, "Document with this _id already exists", err);
    return httpError(res, 400, "Failed to create document", err);
  }
});

// Read one
router.get("/items/:id", async (req, res) => {
  const db = req.db;
  try {
    const doc = await db.get(req.params.id);
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
    if (!incoming._rev) return httpError(res, 409, "Missing _rev for update (optimistic concurrency)");
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
    const merged = Object.assign({}, current, req.body, { _id: current._id, _rev: current._rev });
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

// List (with pagination)
router.get("/items", async (req, res) => {
  const db = req.db;
  try {
    const limit = Math.min(parseInt((req.query && req.query.limit) || "25", 10), 200);
    const skip = parseInt((req.query && req.query.skip) || "0", 10);
    const result = await db.allDocs({ include_docs: true, limit, skip });
    res.json({
      total: result.total_rows,
      offset: result.offset,
      rows: result.rows.map((r) => r.doc),
    });
  } catch (err) {
    return httpError(res, 400, "Failed to list", err);
  }
});

// Mango query
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
    `- usage (query):  GET /items?db={db}\n`
  );
});
