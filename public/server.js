// server.js (Node 16 compatible, CommonJS)

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const crypto = require("crypto");

const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-find"));

// ---- Config ----
const DB_NAME = process.env.DB_NAME || "myitems";
const PORT = process.env.PORT || 3000;

// Local LevelDB-backed store
const db = new PouchDB("./data-" + DB_NAME);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Simple id generator (base62-ish) – avoids ESM-only nanoid
function genId(size) {
  size = size || 21;
  // 62-char alphabet
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function httpError(res, status, message, details) {
  return res.status(status).json({ error: message, details: details || undefined });
}

app.get("/health", function (_req, res) {
  res.json({ ok: true, db: DB_NAME });
});

// ---- CRUD ----

// Create
app.post("/items", async function (req, res) {
  try {
    var doc = req.body || {};
    if (!doc._id) doc._id = genId();
    var putRes = await db.put(doc);
    var saved = await db.get(putRes.id);
    res.status(201).json(saved);
  } catch (err) {
    if (err && err.status === 409) return httpError(res, 409, "Document with this _id already exists", err);
    return httpError(res, 400, "Failed to create document", err);
  }
});

// Read one
app.get("/items/:id", async function (req, res) {
  try {
    var doc = await db.get(req.params.id);
    res.json(doc);
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    return httpError(res, 400, "Failed to read", err);
  }
});

// Replace (full update) – requires _rev
app.put("/items/:id", async function (req, res) {
  try {
    var incoming = req.body || {};
    if (!incoming._rev) return httpError(res, 409, "Missing _rev for update (optimistic concurrency)");
    incoming._id = req.params.id;
    var putRes = await db.put(incoming);
    var saved = await db.get(putRes.id);
    res.json(saved);
  } catch (err) {
    if (err && err.status === 409) return httpError(res, 409, "Conflict: stale _rev", err);
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    return httpError(res, 400, "Failed to update", err);
  }
});

// Patch (partial update)
app.patch("/items/:id", async function (req, res) {
  try {
    var current = await db.get(req.params.id);
    var merged = Object.assign({}, current, req.body, { _id: current._id, _rev: current._rev });
    var putRes = await db.put(merged);
    var saved = await db.get(putRes.id);
    res.json(saved);
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    if (err && err.status === 409) return httpError(res, 409, "Conflict during patch", err);
    return httpError(res, 400, "Failed to patch", err);
  }
});

// Delete – requires latest _rev (accepts ?rev= or body._rev)
app.delete("/items/:id", async function (req, res) {
  try {
    var rev = (req.query && req.query.rev) || (req.body && req.body._rev);
    if (!rev) return httpError(res, 409, "Missing _rev for delete");
    var delRes = await db.remove(req.params.id, rev);
    res.json({ ok: true, id: delRes.id, rev: delRes.rev });
  } catch (err) {
    if (err && err.status === 404) return httpError(res, 404, "Not found", err);
    if (err && err.status === 409) return httpError(res, 409, "Conflict: stale _rev", err);
    return httpError(res, 400, "Failed to delete", err);
  }
});

// List (basic pagination)
app.get("/items", async function (req, res) {
  try {
    var limit = Math.min(parseInt(req.query && req.query.limit ? req.query.limit : "25", 10), 200);
    var skip = parseInt(req.query && req.query.skip ? req.query.skip : "0", 10);
    var result = await db.allDocs({ include_docs: true, limit: limit, skip: skip });
    res.json({
      total: result.total_rows,
      offset: result.offset,
      rows: result.rows.map(function (r) { return r.doc; })
    });
  } catch (err) {
    return httpError(res, 400, "Failed to list", err);
  }
});

// Mango query
app.post("/items/_find", async function (req, res) {
  try {
    var payload = req.body || {};
    var selector = payload.selector || {};
    var limit = payload.limit || 25;
    var skip = payload.skip || 0;
    var sort = payload.sort;
    var result = await db.find({ selector: selector, limit: limit, skip: skip, sort: sort });
    res.json(result.docs);
  } catch (err) {
    return httpError(res, 400, "Query failed", err);
  }
});

// Bulk insert/update
app.post("/items/_bulk", async function (req, res) {
  try {
    var docs = Array.isArray(req.body) ? req.body : [];
    var mapped = docs.map(function (d) { return Object.assign({ _id: d._id || genId() }, d); });
    var resp = await db.bulkDocs(mapped);
    res.json(resp);
  } catch (err) {
    return httpError(res, 400, "Bulk operation failed", err);
  }
});

// Optional: create indexes at startup (no top-level await)
(function createIndexes() {
  db.createIndex({ index: { fields: ["type"] } })
    .then(function () { return db.createIndex({ index: { fields: ["role"] } }); })
    .then(function () { console.log("Indexes created"); })
    .catch(function (e) { console.warn("Index creation failed", e && e.message); });
})();

// Global error guard
app.use(function (err, _req, res, _next) {
  console.error(err);
  return httpError(res, 500, "Unexpected server error", (err && err.message) || St
