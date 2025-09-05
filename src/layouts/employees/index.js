import { useAuth0 } from "@auth0/auth0-react";
import { Box } from "@mui/material";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import MDBox from "components/ui/MDBox";
import MDButton from "components/ui/MDButton";
import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MuiTable } from "../../components/DataTable";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";

const EmployeesComponent = () => {
  const { isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return null;
  }
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
              Employees
            </MDTypography>
          </MDBox>
          <MDBox pt={3}>
            <EmployeesTable />
          </MDBox>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
};

export default EmployeesComponent;
const EmployeesTable = () => {
  const rowsPerPage = 10;
  const [searchParams, setSearchParams] = useState();
  const { setIsLoading } = useContext(LoaderContext);
  const { getAllEmployees, employees, setEmployeeSearchQuery } = useAppStore((state) => state);
  useEffect(() => {
    async function fetchEmployees() {
      setIsLoading(true);
      await getAllEmployees(rowsPerPage, 0);
      setIsLoading(false);
    }
    fetchEmployees();
  }, []);

  const handlePageChange = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    let offset = pageIndex > 0 ? pageIndex * pageSize : 0;
    await getAllEmployees(pageSize, offset);
    setIsLoading(false);
  };

  const onKeyDownAction = (ev) => {
    if (ev.key === "Enter") {
      //Search
      setEmployeeSearchQuery(searchParams);
      getAllEmployees(rowsPerPage, 0);
      ev.preventDefault();
    }
  };
  const clearSearchAction = () => {
    setSearchParams();
    setEmployeeSearchQuery();
    getAllEmployees(rowsPerPage, 0);
  };
  const employeeRows = employees?.employees;
  const rows =
    employeeRows && Array.isArray(employeeRows)
      ? employeeRows.map((row) => {
          const { id, name, initial } = row;
          return {
            id: (
              <Link to={`/employees/${id}`} className="link">
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
            name,
            initial,
          };
        })
      : [];

  const columns = [
    {
      name: "id",
      label: "ID",
    },
    {
      name: "name",
      label: "Name",

      children: (
        <TextField
          value={searchParams?.name || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
        />
      ),
    },
    {
      name: "initial",
      label: "initial",
      children: (
        <Box display={"flex"} alignItems={"center"}>
          <TextField
            value={searchParams?.initial || ""}
            inputProps={{
              style: {
                height: "0.4375em",
              },
            }}
            fullWidth
            margin="dense"
            variant="outlined"
            onKeyDown={onKeyDownAction}
            onChange={(e) => setSearchParams({ ...searchParams, initial: e.target.value })}
          />
          <MDButton
            color="dark"
            style={{ height: 30, marginLeft: 20 }}
            onClick={async () => {
              setIsLoading(true);
              setEmployeeSearchQuery(searchParams);
              await getAllEmployees(rowsPerPage, 0);
              setIsLoading(false);
            }}
          >
            Search
          </MDButton>
          <MDTypography
            paddingLeft={1}
            sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
              fontSize: size.sm,
            })}
            component="a"
            href="javascript:void(0)"
            variant="caption"
            color="text"
            fontWeight="medium"
            onClick={() => clearSearchAction()}
          >
            <Tooltip title="Clear Search">
              <Icon fontSize="small" color="error">
                clear
              </Icon>
            </Tooltip>
          </MDTypography>
        </Box>
      ),
    },
  ];

  return (
    <MuiTable
      data={rows}
      columns={columns}
      totalCount={employees?.totalCount || null}
      options={{ rowsPerPage: rowsPerPage }}
      onPageChange={(args) => handlePageChange(args)}
    />
  );
};
