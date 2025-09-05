import { useAppStore } from "lib/store/appStore";
import { MuiTable } from "../../components/DataTable";
import MDTypography from "components/ui/MDTypography";
import { useContext, useEffect, useState } from "react";
import { LoaderContext } from "index";
import { Box } from "@mui/material";
import moment from "moment";
import MDBox from "components/ui/MDBox";
import { Link } from "react-router-dom";

const EmployeeDetails = ({ employeeId = null }) => {
  if (!employeeId) return null;

  const { setIsLoading } = useContext(LoaderContext);

  const { employeeInfo, employeeConcepts, getEmployeeInfoById, getEmployeeConceptsById } =
    useAppStore((state) => state);

  useEffect(() => {
    async function fetchEmployeeDetails() {
      setIsLoading(true);
      await getEmployeeInfoById(employeeId);
      await getEmployeeConceptsById(employeeId);
      setIsLoading(false);
    }
    fetchEmployeeDetails();
  }, []);

  const EmployeeConceptsTable = () => {
    const rows = employeeConcepts
      ? employeeConcepts.map((row) => {
          const { id, title, status, description, inscope, created_at, updated_at } = row;
          return {
            id: (
              <Link to={`/concepts/${id}`} className="link">
                <MDTypography
                  variant="caption"
                  fontWeight="medium"
                  sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                    fontSize: size.sm, //size.sm
                  })}
                >
                  {id}
                </MDTypography>
              </Link>
            ),
            title,
            status,
            description,
            inscope,
            created_at: created_at ? moment(created_at).format("MM/DD/YYYY") : "",
            updated_at: updated_at ? moment(updated_at).format("MM/DD/YYYY") : "",
          };
        })
      : [];

    const columns = [
      { name: "id", label: "ID" },
      { name: "title", label: "Title" },
      { name: "status", label: "Status" },
      { name: "description", label: "Description" },
      { name: "inscope", label: "Inscope" },
      { name: "created_at", label: "Creation Date" },
      { name: "updated_at", label: "Modification Date" },
    ];
    return <MuiTable data={rows} columns={columns} options={{ page: 0, rowsPerPage: 10 }} />;
  };

  const RenderEmployeeDetails = ({ label, value }) => {
    return (
      <MDTypography
        sx={({ typography: { size }, borders: { borderWidth } }) => ({
          fontSize: size.xl,
          fontWeight: "normal",
        })}
      >
        <strong>{label}:</strong> {value}
      </MDTypography>
    );
  };
  return (
    <>
      <Box>
        <MDTypography variant="h4" pb={4}>
          Employee Detail
        </MDTypography>
        <Box className="employee-info" display="flex" flexDirection="column" gap={1} pb={2}>
          <RenderEmployeeDetails label="ID" value={employeeInfo?.id} />
          <RenderEmployeeDetails label="Name" value={employeeInfo?.name} />
          <RenderEmployeeDetails label="Initial" value={employeeInfo?.initial} />
        </Box>
        <MDBox pt={4} pb={1}>
          <MDTypography variant="h4">Concepts</MDTypography>
          <MDBox pt={3}></MDBox>
          <EmployeeConceptsTable />
        </MDBox>
      </Box>
    </>
  );
};

export default EmployeeDetails;
