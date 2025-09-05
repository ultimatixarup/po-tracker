import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import { useContext, useEffect } from "react";
import { MuiTable } from "../../components/DataTable";

// --- helpers ---
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
const fmtMoney = (n) =>
  n === null || n === undefined
    ? ""
    : Number(n).toLocaleString(undefined, { style: "currency", currency: "USD" });

const RenderModuleDetails = ({ label, value }) => {
  return (
    <MDTypography
      sx={({ typography: { size } }) => ({
        fontSize: size.xl,
        fontWeight: "normal",
      })}
    >
      <strong>{label}:</strong> {value ?? ""}
    </MDTypography>
  );
};

const ModuleConceptsTable = () => {
  const rows = Array.isArray(ModuleConcepts)
    ? ModuleConcepts.map((row) => {
        const {
          id,
          PMS,
          WBS,
          PCM,
          PL,
          GL,
          FOProjectName,
          POProjectStart,
          WkStart,
          ProjectEnd,
          WkEnd,
          PRNumber,
          PRStatus,
          PO,
          POManWks,
          PRAmount,
          PRWklyRate,
          POMonthlyBillRate,
        } = row;
        return {
          id,
          PMS,
          WBS,
          PCM,
          PL,
          GL,
          FOProjectName,
          POProjectStart,
          WkStart,
          ProjectEnd,
          WkEnd,
          PRNumber,
          PRStatus,
          PO,
          POManWks,
          PRAmount,
          PRWklyRate,
          POMonthlyBillRate,
        };
      })
    : [];

  // Your current definition
  const columnsRaw = [
    { name: "id", label: "ID", align: "center" },
    { name: "PMS", label: "PMS", align: "left" },
    { name: "WBS", label: "WBS", align: "left" },
    { name: "PCM", label: "PCM", align: "left" },
    { name: "PL", label: "PL", align: "center" },
    { name: "GL", label: "GL", align: "center" },
    { name: "FOProjectName", label: "Project Name", align: "left" },
    { name: "POProjectStart", label: "Project Start", align: "center" },
    { name: "WkStart", label: "Week Start", align: "center" },
    { name: "ProjectEnd", label: "Project End", align: "center" },
    { name: "WkEnd", label: "Week End", align: "center" },
    { name: "PRNumber", label: "PR Number", align: "center" },
    { name: "PRStatus", label: "PR Status", align: "center" },
    { name: "PO", label: "PO", align: "center" },
    { name: "POManWks", label: "PO Man Weeks", align: "center" },
    { name: "PRAmount", label: "PR Amount", align: "right" },
    { name: "PRWklyRate", label: "PR Weekly Rate", align: "right" },
    { name: "POMonthlyBillRate", label: "PO Monthly Bill Rate", align: "right" },
  ];

  // If your MuiTable expects DataGrid-style columns, normalize:
  const columns = toDataGridColumns(columnsRaw);

  // IMPORTANT: give height if MuiTable wraps DataGrid
  return (
    <MuiTable
      data={rows}
      columns={columns}
      options={{ page: 0, rowsPerPage: 10 }}
      tableProps={{ autoHeight: true, sx: { minHeight: 360 } }} // one of these should be honored
    />
  );
};
const ModuleDetails = ({ ModuleId = null }) => {
  if (!ModuleId) return null;

  const { setIsLoading } = useContext(LoaderContext);
  const { ModuleInfo, ModuleConcepts, getModuleInfoById, getModuleConceptsById } = useAppStore(
    (state) => state
  );

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        await Promise.all([getModuleInfoById(ModuleId), getModuleConceptsById(ModuleId)]);
      } finally {
        // only update loader if still mounted
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [ModuleId, setIsLoading, getModuleInfoById, getModuleConceptsById]);

  return (
    alert("returning muitable"),
    (
      <MuiTable
        data={rows}
        columns={columns}
        totalCount={rows?.totalCount || null}
        options={{ rowsPerPage: rowsPerPage }}
        onPageChange={(args) => handlePageChange(args)}
      />
    )
  );

  // return (
  //   <Box>
  //     <MDTypography variant="h4" pb={4}>
  //       Module Detail
  //     </MDTypography>

  //     <MDBox pt={4} pb={1}>
  //       <MDTypography variant="h4">Concepts</MDTypography>
  //       <MDBox pt={3} />
  //       <ModuleConceptsTable ModuleConcepts={ModuleConcepts} />
  //     </MDBox>
  //   </Box>
  // );
};

export default ModuleDetails;
