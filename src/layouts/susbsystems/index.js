// src/layouts/susbsystems/index.js
import { Add } from "@mui/icons-material";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import Card from "@mui/material/Card";
import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MuiTable } from "../../components/DataTable";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";

/* ---------------- Page Shell ---------------- */
const SubsytemsComponent = () => {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Card>
          <MDBox
            mx={2}
            mt={-3}
            py={3}
            px={2}
            variant="gradient"
            bgColor="info"
            borderRadius="lg"
            coloredShadow="info"
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <MDTypography variant="h6" color="white">
                Billing Data
              </MDTypography>
              <AddNewButton />
            </Stack>
          </MDBox>
          <MDBox pt={3}>
            <SubsystemsTable />
          </MDBox>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
};

export default SubsytemsComponent;

/* ---- Tiny “bus” so header button can trigger add without prop drilling ---- */
let _openAddInlineRef = null;
function useInlineBus() {
  return { openAddInline: () => _openAddInlineRef && _openAddInlineRef() };
}
const AddNewButton = () => {
  const { openAddInline } = useInlineBus();
  return (
    <Button
      onClick={openAddInline}
      startIcon={<Add />}
      variant="contained"
      color="secondary"
      size="small"
    >
      Add New
    </Button>
  );
};

/* ---------------- Toolbar *inside* the table ---------------- */
const FilterToolbar = ({
  filterText,
  setFilterText,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  sortableColumns,
  columnsDef,
  showColFilters,
  toggleColFilters,
  clearAll,
}) => {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1}
      sx={{ p: 1, alignItems: "center", width: "100%", maxWidth: 900 }}
    >
      <TextField
        label="Global Filter"
        placeholder="Type to filter all columns…"
        size="small"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        sx={{ minWidth: 220, flex: 1 }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="sort-by-label">Sort By</InputLabel>
        <Select
          labelId="sort-by-label"
          label="Sort By"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <MenuItem value="">
            <em>(none)</em>
          </MenuItem>
          {sortableColumns.map((col) => (
            <MenuItem key={col} value={col}>
              {columnsDef.find((c) => c.name === col)?.label || col}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="sort-dir-label">Direction</InputLabel>
        <Select
          labelId="sort-dir-label"
          label="Direction"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          disabled={!sortBy}
        >
          <MenuItem value="asc">Asc</MenuItem>
          <MenuItem value="desc">Desc</MenuItem>
        </Select>
      </FormControl>
      <Button variant="outlined" size="small" onClick={clearAll}>
        Clear
      </Button>
      <Button variant="text" size="small" onClick={toggleColFilters}>
        {showColFilters ? "Hide Column Filters" : "Show Column Filters"}
      </Button>
    </Stack>
  );
};

/* ---------------- Table ---------------- */
const SubsystemsTable = () => {
  const rowsPerPage = 10;
  const [pageIndex, setPageIndex] = useState(0);

  const { setIsLoading } = useContext(LoaderContext);
  const { getAllSubsystems, subsystems, createSubsystem, updateSubsystem, deleteSubsystem } =
    useAppStore((state) => state);

  // initial fetch
  useEffect(() => {
    const fetchSubsystems = async () => {
      setIsLoading(true);
      await getAllSubsystems(rowsPerPage, 0);
      setIsLoading(false);
    };
    fetchSubsystems();
  }, [getAllSubsystems, rowsPerPage, setIsLoading]);

  const handlePageChange = async ({ pageIndex: p, pageSize }) => {
    setIsLoading(true);
    const offset = p > 0 ? p * pageSize : 0;
    setPageIndex(p);
    await getAllSubsystems(pageSize, offset);
    setIsLoading(false);
  };

  /* --------- Columns definition --------- */
  const columnsDef = useMemo(
    () => [
      { name: "id", label: "ID", align: "center", editable: false },
      { name: "PMS", label: "PMS", align: "left", editable: true },
      { name: "WBS", label: "WBS", align: "left", editable: true },
      { name: "PCM", label: "PCM", align: "left", editable: true },
      { name: "PL", label: "PL", align: "center", editable: true },
      { name: "GL", label: "GL", align: "center", editable: true },
      { name: "FOProjectName", label: "Project Name", align: "left", editable: true },
      { name: "POProjectStart", label: "Project Start", align: "center", editable: true },
      { name: "WkStart", label: "Week Start", align: "center", editable: true },
      { name: "ProjectEnd", label: "Project End", align: "center", editable: true },
      { name: "WkEnd", label: "Week End", align: "center", editable: true },
      { name: "PRNumber", label: "PR Number", align: "center", editable: true },
      { name: "PRStatus", label: "PR Status", align: "center", editable: true },
      { name: "PO", label: "PO", align: "center", editable: true },
      { name: "POManWks", label: "PO Man Weeks", align: "center", editable: true },
      { name: "PRAmount", label: "PR Amount", align: "right", editable: true },
      { name: "PRWklyRate", label: "PR Weekly Rate", align: "right", editable: true },
      { name: "POMonthlyBillRate", label: "PO Monthly Bill Rate", align: "right", editable: true },
      { name: "__actions", label: "Actions", align: "center", editable: false },
    ],
    []
  );

  /* --------- Shape server rows or stubs --------- */
  const serverRows = subsystems?.subsystems;

  const ymd = (d) => d.toISOString().slice(0, 10);

  const baselineStubRows = useMemo(() => {
    const base = new Date();
    const mk = (n, name) => {
      const start = new Date(base);
      start.setDate(start.getDate() + 7 * (n - 1));
      const wkEnd = new Date(start);
      wkEnd.setDate(start.getDate() + 6);
      const projEnd = new Date(start);
      projEnd.setMonth(projEnd.getMonth() + 3);
      return {
        id: `STUB-${n}`,
        PMS: `PMS-00${n}`,
        WBS: `WBS-000${n}`,
        PCM: `PCM-00${n}`,
        PL: `PL-0${n}`,
        GL: `GL-0${n}`,
        FOProjectName: name,
        POProjectStart: ymd(start),
        WkStart: ymd(start),
        ProjectEnd: ymd(projEnd),
        WkEnd: ymd(wkEnd),
        PRNumber: `PR-10${n}0`,
        PRStatus: n % 3 === 0 ? "CLOSED" : n % 2 === 0 ? "APPROVED" : "OPEN",
        PO: `PO-20${n}0`,
        POManWks: 4 + n,
        PRAmount: 4500 + n * 500,
        PRWklyRate: 1000 + n * 100,
        POMonthlyBillRate: 18000 + n * 2000,
      };
    };
    return [
      mk(1, "Apollo Revamp"),
      mk(2, "Zephyr Migration"),
      mk(3, "Orion Analytics"),
      mk(4, "Helios Dashboard"),
      mk(5, "Nimbus ETL"),
    ];
  }, []);

  const baseRows = useMemo(() => {
    if (Array.isArray(serverRows) && serverRows.length > 0) {
      return serverRows.map((row) => ({
        id: row?.id,
        PMS: row?.PMS,
        WBS: row?.WBS,
        PCM: row?.PCM,
        PL: row?.PL,
        GL: row?.GL,
        FOProjectName: row?.FOProjectName,
        POProjectStart: row?.POProjectStart,
        WkStart: row?.WkStart,
        ProjectEnd: row?.ProjectEnd,
        WkEnd: row?.WkEnd,
        PRNumber: row?.PRNumber,
        PRStatus: row?.PRStatus,
        PO: row?.PO,
        POManWks: row?.POManWks,
        PRAmount: row?.PRAmount,
        PRWklyRate: row?.PRWklyRate,
        POMonthlyBillRate: row?.POMonthlyBillRate,
      }));
    }
    return baselineStubRows;
  }, [serverRows, baselineStubRows]);

  // local buffers & overlays
  const [newRows, setNewRows] = useState([]);     // rows created locally (incl. saved)
  const [overrides, setOverrides] = useState({}); // id -> updated fields (optimistic updates)

  // Merge newRows first, then baseRows, and dedupe by id
  const rows = useMemo(() => {
    const seen = new Set();
    const combined = [...newRows, ...baseRows].filter((r) => {
      if (!r || !r.id) return false;
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
    return combined;
  }, [newRows, baseRows]);

  // Apply optimistic overrides so changes persist visually
  const effectiveRows = useMemo(
    () => rows.map((r) => (overrides[r.id] ? { ...r, ...overrides[r.id] } : r)),
    [rows, overrides]
  );

  /* --------- Inline edit state --------- */
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  // stub defaults for "Add New"
  const buildStubRow = useCallback(() => {
    const now = new Date();
    const wkEnd = new Date(now);
    wkEnd.setDate(now.getDate() + 6);
    const projEnd = new Date(now);
    projEnd.setMonth(now.getMonth() + 3);
    return {
      id: `NEW-${Date.now()}`,
      PMS: "PMS-001",
      WBS: "WBS-000X",
      PCM: "PCM-001",
      PL: "PL-01",
      GL: "GL-01",
      FOProjectName: "New Project",
      POProjectStart: ymd(now),
      WkStart: ymd(now),
      ProjectEnd: ymd(projEnd),
      WkEnd: ymd(wkEnd),
      PRNumber: "PR-100X",
      PRStatus: "OPEN",
      PO: "PO-200X",
      POManWks: 4,
      PRAmount: 5000,
      PRWklyRate: 1250,
      POMonthlyBillRate: 20000,
    };
  }, []);

  // expose “Add New” from header
  useEffect(() => {
    _openAddInlineRef = () => {
      const stub = buildStubRow();
      setNewRows((prev) => [stub, ...prev]);
      setEditingId(stub.id);
      setDraft(stub);
    };
    return () => {
      _openAddInlineRef = null;
    };
  }, [buildStubRow]);

  const startInlineEdit = useCallback((row) => {
    setEditingId(row?.id ?? null);
    setDraft(row ?? null);
  }, []);

  const cancelInline = useCallback(() => {
    if (editingId && String(editingId).startsWith("NEW-")) {
      setNewRows((prev) => prev.filter((r) => r.id !== editingId));
    }
    setEditingId(null);
    setDraft(null);
  }, [editingId]);

  const updateDraft = useCallback((field, value) => {
    setDraft((d) => ({ ...(d || {}), [field]: value }));
  }, []);

  const saveInline = useCallback(async () => {
    if (!draft) return;
    setIsLoading(true);
    try {
      if (String(draft.id).startsWith("NEW-")) {
        // CREATE: optimistic keep
        let created;
        if (typeof createSubsystem === "function") {
          created = await createSubsystem(draft); // may return created row/id
        }
        const returnedId = created?.id ?? created?.Id ?? created?.ID;
        const normalized = returnedId ? { ...draft, ...created, id: returnedId } : { ...draft };
        setNewRows((prev) => prev.map((r) => (r.id === draft.id ? normalized : r)));
      } else {
        // UPDATE: optimistic overlay
        if (typeof updateSubsystem === "function") {
          await updateSubsystem(draft.id, draft);
        }
        setOverrides((prev) => ({ ...prev, [draft.id]: { ...draft } }));
      }

      // reconcile in background (dedupe prevents doubles)
      await getAllSubsystems(rowsPerPage, pageIndex * rowsPerPage);
      setEditingId(null);
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    draft,
    createSubsystem,
    updateSubsystem,
    getAllSubsystems,
    rowsPerPage,
    pageIndex,
    setIsLoading,
  ]);

  const handleDelete = useCallback(
    async (row) => {
      const rowId = row?.id;
      if (!rowId) return;

      // remove from local buffers first
      setNewRows((prev) => prev.filter((r) => r.id !== rowId));
      setOverrides((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };
        delete next[rowId];
        return next;
      });

      // if it's a temp NEW row, we're done
      if (String(rowId).startsWith("NEW-")) {
        if (editingId === rowId) {
          setEditingId(null);
          setDraft(null);
        }
        return;
      }

      const ok = window.confirm("Delete this record?");
      if (!ok) return;

      setIsLoading(true);
      try {
        if (typeof deleteSubsystem === "function") {
          await deleteSubsystem(rowId);
        }
        await getAllSubsystems(rowsPerPage, pageIndex * rowsPerPage);
      } finally {
        setIsLoading(false);
      }
    },
    [deleteSubsystem, editingId, getAllSubsystems, pageIndex, rowsPerPage, setIsLoading]
  );

  /* =========================
     FILTER + SORT (client-side)
     ========================= */
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState(""); // column name
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'
  const [showColFilters, setShowColFilters] = useState(true); // <— defined ONCE here
  const [columnFilters, setColumnFilters] = useState({}); // { [colName]: string }

  const searchableColumns = useMemo(
    () => columnsDef.filter((c) => c.name !== "__actions").map((c) => c.name),
    [columnsDef]
  );
  const sortableColumns = searchableColumns;

  const normalize = (v) => {
    if (v == null) return "";
    if (typeof v === "number") return v.toString();
    if (typeof v === "string") return v.trim();
    return String(v ?? "");
  };
  const isDateString = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

  const getSortValue = (row, col) => {
    const raw = normalize(row[col]);
    if (raw === "") return "";
    const num = Number(raw);
    if (!Number.isNaN(num) && raw !== "") return num;
    if (isDateString(raw)) return new Date(raw).getTime();
    return raw.toLowerCase();
  };

  // Apply global filter
  const globallyFiltered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return effectiveRows;
    return effectiveRows.filter((r) =>
      searchableColumns.some((col) => normalize(r[col]).toLowerCase().includes(q))
    );
  }, [effectiveRows, filterText, searchableColumns]);

  // Apply per-column filters
  const columnFiltered = useMemo(() => {
    const activeCols = Object.keys(columnFilters).filter(
      (c) => (columnFilters[c] || "").trim() !== ""
    );
    if (activeCols.length === 0) return globallyFiltered;
    return globallyFiltered.filter((r) =>
      activeCols.every((c) =>
        normalize(r[c]).toLowerCase().includes(columnFilters[c].trim().toLowerCase())
      )
    );
  }, [globallyFiltered, columnFilters]);

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortBy) return columnFiltered;
    const dir = sortDir === "desc" ? -1 : 1;
    const arr = [...columnFiltered];
    arr.sort((a, b) => {
      const av = getSortValue(a, sortBy);
      const bv = getSortValue(b, sortBy);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return arr;
  }, [columnFiltered, sortBy, sortDir]);

  /* --------- Build display rows: inject editors & actions as cell values --------- */
  const typeFor = (name) =>
    /Rate|Amount|ManWks/i.test(name) ? "number" : /Start|End|Date/i.test(name) ? "date" : "text";

  const displayRows = useMemo(() => {
    return sortedRows.map((r) => {
      const isEditing = editingId === r.id;
      const out = { ...r };

      if (isEditing && draft) {
        columnsDef.forEach((c) => {
          if (c.editable && c.name !== "__actions") {
            out[c.name] = (
              <TextField
                size="small"
                fullWidth
                type={typeFor(c.name)}
                value={draft[c.name] ?? ""}
                onChange={(e) => updateDraft(c.name, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveInline();
                  if (e.key === "Escape") cancelInline();
                }}
                InputLabelProps={typeFor(c.name) === "date" ? { shrink: true } : undefined}
              />
            );
          }
        });
      }

      out.__actions = isEditing ? (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button size="small" variant="contained" onClick={saveInline}>
            Save
          </Button>
          <Button size="small" variant="outlined" onClick={cancelInline}>
            Cancel
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button size="small" variant="outlined" onClick={() => startInlineEdit(r)}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(r)}>
            Delete
          </Button>
        </Stack>
      );

      return out;
    });
  }, [
    sortedRows,
    editingId,
    draft,
    columnsDef,
    updateDraft,
    saveInline,
    cancelInline,
    handleDelete,
    startInlineEdit,
  ]);

  // Keep totalCount in sync with what we display
  const displayTotal = useMemo(() => {
    const tc = subsystems?.totalCount;
    return typeof tc === "number" && tc > 0 ? tc : displayRows.length;
  }, [subsystems?.totalCount, displayRows.length]);

  // Columns for MuiTable
  const columns = useMemo(
    () =>
      columnsDef.map(({ name, label, align }) => ({
        name,
        label,
        align,
        options: { filter: name !== "__actions", sort: true },
      })),
    [columnsDef]
  );

  // Toolbar node injected into table toolbar — reuses the ONE showColFilters state
  const toolbarNode = useMemo(
    () => (
      <FilterToolbar
        filterText={filterText}
        setFilterText={setFilterText}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        sortableColumns={sortableColumns}
        columnsDef={columnsDef}
        showColFilters={showColFilters}
        toggleColFilters={() => setShowColFilters((s) => !s)}
        clearAll={() => {
          setFilterText("");
          setSortBy("");
          setSortDir("asc");
          setColumnFilters({});
        }}
      />
    ),
    [
      filterText,
      sortBy,
      sortDir,
      sortableColumns,
      columnsDef,
      showColFilters,
      setShowColFilters,
    ]
  );

  // Column filter inputs (rendered above table)
  const columnFilterInputs = useMemo(() => {
    if (!showColFilters) return null;
    return (
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ px: 2, pb: 1 }}
      >
        {columnsDef
          .filter((c) => c.name !== "__actions")
          .map((c) => (
            <TextField
              key={c.name}
              size="small"
              label={c.label}
              placeholder={`Filter ${c.label}`}
              value={columnFilters[c.name] || ""}
              onChange={(e) =>
                setColumnFilters((prev) => ({ ...prev, [c.name]: e.target.value }))
              }
              sx={{ minWidth: 160, flex: "1 1 160px" }}
            />
          ))}
      </Stack>
    );
  }, [columnsDef, columnFilters, showColFilters]);

  return (
    <>
      {columnFilterInputs}

      <MuiTable
        data={displayRows}
        columns={columns}
        totalCount={displayTotal}
        options={{
          rowsPerPage,
          search: true,
          filter: true,
          viewColumns: true,
          print: false,
          download: false,
          filterType: "textField",
          searchText: filterText,
          onSearchChange: (text) => setFilterText(typeof text === "string" ? text : ""),
          customToolbar: () => toolbarNode,
        }}
        onPageChange={(args) => handlePageChange(args)}
      />
    </>
  );
};
