// src/layouts/susbsystems/index.js
import { Add } from "@mui/icons-material";
import { Button, Stack, TextField } from "@mui/material";
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

/* ---------------- Table ---------------- */
const SubsystemsTable = () => {
  const rowsPerPage = 10;
  const [pageIndex, setPageIndex] = useState(0);

  const { setIsLoading } = useContext(LoaderContext);
  const {
    getAllSubsystems,
    subsystems,
    createSubsystem,
    updateSubsystem,
    deleteSubsystem,
  } = useAppStore((state) => state);

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

  /* --------- Columns definition (used for building editable cells) --------- */
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
    // server empty? show baseline stubs
    return baselineStubRows;
  }, [serverRows, baselineStubRows]);

  // local buffer for NEW rows (so they appear before server save)
  const [newRows, setNewRows] = useState([]);

  const rows = useMemo(() => {
    // show NEW rows first
    return [...newRows, ...baseRows];
  }, [newRows, baseRows]);

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

  const { totalCount: serverTotalCount } = subsystems || {};

  const saveInline = useCallback(async () => {
    if (!draft) return;
    setIsLoading(true);
    try {
      if (String(draft.id).startsWith("NEW-")) {
        if (typeof createSubsystem === "function") {
          await createSubsystem(draft);
        } else {
          // eslint-disable-next-line no-console
          console.log("createSubsystem not wired; payload:", draft);
        }
        setNewRows((prev) => prev.filter((r) => r.id !== draft.id));
      } else {
        if (typeof updateSubsystem === "function") {
          await updateSubsystem(draft.id, draft);
        } else {
          // eslint-disable-next-line no-console
          console.log("updateSubsystem not wired; payload:", draft);
        }
      }
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
      // if it's a local NEW row, just drop it
      if (String(rowId).startsWith("NEW-")) {
        setNewRows((prev) => prev.filter((r) => r.id !== rowId));
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
        } else {
          // eslint-disable-next-line no-console
          console.log("deleteSubsystem not wired; id:", rowId);
        }
        await getAllSubsystems(rowsPerPage, pageIndex * rowsPerPage);
      } finally {
        setIsLoading(false);
      }
    },
    [deleteSubsystem, editingId, getAllSubsystems, pageIndex, rowsPerPage, setIsLoading]
  );

  /* --------- Build display rows: inject editors & actions directly as cell values --------- */
  const typeFor = (name) =>
    /Rate|Amount|ManWks/i.test(name) ? "number" : /Start|End|Date/i.test(name) ? "date" : "text";

  const displayRows = useMemo(() => {
    return rows.map((r) => {
      const isEditing = editingId === r.id;
      const out = { ...r };

      // turn editable fields into <TextField> when the row is being edited
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

      // actions column as plain Buttons
      out.__actions = isEditing ? (
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button size="small" variant="contained" color="success" onClick={saveInline}>
            Save
          </Button>
          <Button size="small" variant="outlined" color="warning" onClick={cancelInline}>
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
  }, [rows, editingId, draft, columnsDef, updateDraft, saveInline, cancelInline, handleDelete, startInlineEdit]);

  // Keep totalCount in sync with what we display so the grid actually renders rows.
  const displayTotal = useMemo(() => {
    return typeof serverTotalCount === "number" && serverTotalCount > 0
      ? serverTotalCount
      : displayRows.length;
  }, [serverTotalCount, displayRows.length]);

  // Columns for MuiTable (no custom renderers needed now)
  const columns = useMemo(
    () => columnsDef.map(({ name, label, align }) => ({ name, label, align })),
    [columnsDef]
  );

  return (
    <MuiTable
      data={displayRows}
      columns={columns}
      totalCount={displayTotal}
      options={{ rowsPerPage }}
      onPageChange={(args) => handlePageChange(args)}
    />
  );
};
