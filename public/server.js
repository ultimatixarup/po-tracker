// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { nanoid } = require("nanoid");

// PouchDB + plugins
const PouchDB = require("pouchdb");
PouchDB.plugin(require("pouchdb-find"));

// === Config ===
const DB_NAME = process.env.DB_NAME || "myitems";
const PORT = process.env.PORT || 3000;

// Local LevelDB-backed database folder "./data-<DB_NAME>"
const db = new PouchDB(`./data-${DB_NAME}`);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Health
app.get("/health", (_req, res) => res.json({ ok: true, db: DB_NAME }));

// --- Helpers ---
function httpError(res, status, message, details) {
  return res.status(status).json({ error: message, details });
}

// --- CRUD ---
// Create
app.post("/items", async (req, res) => {
  try {
    const doc = req.body || {};
    // Allow client-supplied _id, otherwise generate
    if (!doc._id) doc._id = nanoid();
    const putRes = await db.put(doc);
    const saved = await db.get(putRes.id);
    return res.status(201).json(saved);
  } catch (err) {
    if (err.status === 409) {
      return httpError(res, 409, "Document with this _id already exists", err);
    }
    return httpError(res, 400, "Failed to create document", err);
  }
});

// Read one
app.get("/items/:id", async (req, res) => {
  try {
    const doc = await db.get(req.params.id);
    return res.json(doc);
  } catch (err) {
    if (err.status === 404) {
      return httpError(res, 404, "Not found", err);
    }
    return httpError(res, 400, "Failed to read", err);
  }
});

// Replace (full update) – requires _rev
app.put("/items/:id", async (req, res) => {
  try {
    const incoming = req.body || {};
    if (!incoming._rev) {
      return httpError(res, 409, "Missing _rev for update (optimistic concurrency)");
    }
    incoming._id = req.params.id;
    const putRes = await db.put(incoming);
    const saved = await db.get(putRes.id);
    return res.json(saved);
  } catch (err) {
    if (err.status === 409) {
      return httpError(res, 409, "Conflict: stale _rev", err);
    } else if (err.status === 404) {
      return httpError(res, 404, "Not found", err);
    }
    return httpError(res, 400, "Failed to update", err);
  }
});

// Patch (partial update) – merges fields
app.patch("/items/:id", async (req, res) => {
  try {
    const current = await db.get(req.params.id);
    const merged = { ...current, ...req.body, _id: current._id, _rev: current._rev };
    const putRes = await db.put(merged);
    const saved = await db.get(putRes.id);
    return res.json(saved);
  } catch (err) {
    if (err.status === 404) {
      return httpError(res, 404, "Not found", err);
    } else if (err.status === 409) {
      return httpError(res, 409, "Conflict during patch", err);
    }
    return httpError(res, 400, "Failed to patch", err);
  }
});

// Delete – requires latest _rev (safer). Accepts ?rev=<_rev> or body._rev
app.delete("/items/:id", async (req, res) => {
  try {
    const rev = req.query.rev || req.body?._rev;
    if (!rev) {
      return httpError(res, 409, "Missing _rev for delete");
    }
    const delRes = await db.remove(req.params.id, rev);
    return res.json({ ok: true, id: delRes.id, rev: delRes.rev });
  } catch (err) {
    if (err.status === 404) {
      return httpError(res, 404, "Not found", err);
    } else if (err.status === 409) {
      return httpError(res, 409, "Conflict: stale _rev", err);
    }
    return httpError(res, 400, "Failed to delete", err);
  }
});

// List with basic pagination + optional Mango selector
// GET /items?limit=20&skip=0  (basic list)
// POST /items/_find { selector, limit, skip, sort }
app.get("/items", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "25", 10), 200);
    const skip = parseInt(req.query.skip || "0", 10);

    // Fast list using _all_docs; include_docs = true returns docs directly
    const result = await db.allDocs({ include_docs: true, limit, skip });
    return res.json({
      total: result.total_rows,
      offset: result.offset,
      rows: result.rows.map(r => r.doc),
    });
  } catch (err) {
    return httpError(res, 400, "Failed to list", err);
  }
});

// Rich query endpoint (Mango)
app.post("/items/_find", async (req, res) => {
  try {
    const { selector = {}, limit = 25, skip = 0, sort } = req.body || {};
    const result = await db.find({ selector, limit, skip, sort });
    return res.json(result.docs);
  } catch (err) {
    return httpError(res, 400, "Query failed", err);
  }
});

// Bulk insert/update
app.post("/items/_bulk", async (req, res) => {
  try {
    const docs = Array.isArray(req.body) ? req.body : [];
    const resp = await db.bulkDocs(
      docs.map(d => ({ _id: d._id || nanoid(), ...d }))
    );
    return res.json(resp);
  } catch (err) {
    return httpError(res, 400, "Bulk operation failed", err);
  }
});

// Global error guard
app.use((err, _req, res, _next) => {
  console.error(err);
  return httpError(res, 500, "Unexpected server error", err?.message);
});

app.listen(PORT, () => {
  console.log(`PouchDB REST API listening on http://localhost:${PORT} (db: ${DB_NAME})`);
});
