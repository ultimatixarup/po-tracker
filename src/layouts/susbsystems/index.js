import Card from "@mui/material/Card";
import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import { useContext, useEffect, useState } from "react";
import { MuiTable } from "../../components/DataTable";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";

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
            <MDTypography variant="h6" color="white">
              Billing Data
            </MDTypography>
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
const SubsystemsTable = () => {
  const [searchParams, setSearchParams] = useState();
  const rowsPerPage = 10;
  const { setIsLoading } = useContext(LoaderContext);
  const { getAllSubsystems, subsystems, setSubsystemSearchQuery } = useAppStore((state) => state);
  useEffect(() => {
    async function fetchSubsystems() {
      setIsLoading(true);
      await getAllSubsystems(rowsPerPage, 0);
      setIsLoading(false);
    }
    fetchSubsystems();
  }, []);

  const handlePageChange = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    let offset = pageIndex > 0 ? pageIndex * pageSize : 0;
    await getAllSubsystems(pageSize, offset);
    setIsLoading(false);
  };

  const onKeyDownAction = (ev) => {
    if (ev.key === "Enter") {
      //Search
      setSubsystemSearchQuery(searchParams);
      getAllSubsystems(rowsPerPage, 0);
      ev.preventDefault();
    }
  };
  const clearSearchAction = () => {
    setSearchParams();
    setSubsystemSearchQuery();
    getAllSubsystems(rowsPerPage, 0);
  };

  const subsystemRows = subsystems?.subsystems;
  const rows =
    subsystemRows && Array.isArray(subsystemRows)
      ? subsystemRows.map((row) => {
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

  const columns = [
    { name: "id", label: "ID", align: "center" },
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
  ];

  return (
    <MuiTable
      data={rows}
      columns={columns}
      totalCount={subsystems?.totalCount || null}
      options={{ rowsPerPage: rowsPerPage }}
      onPageChange={(args) => handlePageChange(args)}
    />
  );
};
