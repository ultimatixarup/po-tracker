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
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";
import ModuleDetails from "./ModuleDetails";

const ModulesComponent = () => {
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
              Modules
            </MDTypography>
          </MDBox>
          <MDBox pt={3}>
            <ModulesTable />
          </MDBox>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
};

export default ModulesComponent;
const ModulesTable = () => {
  const rowsPerPage = 10;
  const [searchParams, setSearchParams] = useState();
  const { setIsLoading } = useContext(LoaderContext);
  const { getAllModules, modules, setModulesSearchQuery } = useAppStore((state) => state);
  useEffect(() => {
    async function fetchModules() {
      setIsLoading(true);
      await getAllModules(rowsPerPage, 0);
      setIsLoading(false);
    }
    fetchModules();
  }, []);

  const handlePageChange = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    let offset = pageIndex > 0 ? pageIndex * pageSize : 0;
    await getAllModules(pageSize, offset);
    setIsLoading(false);
  };

  const clearSearchAction = () => {
    setSearchParams();
    setModulesSearchQuery();
    getAllModules(rowsPerPage, 0);
  };
  const onKeyDownAction = (ev) => {
    if (ev.key === "Enter") {
      //Search
      setModulesSearchQuery(searchParams);
      getAllModules(rowsPerPage, 0);
      ev.preventDefault();
    }
  };
  //   console.log(employees);
  const moduleRows = modules?.modules;
  console.log("moduleRows===========", moduleRows);
  const rows =
    moduleRows && Array.isArray(moduleRows)
      ? moduleRows.map((row) => {
          const { id, name } = row;
          return {
            id,
            name,
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
        <Box display={"flex"} alignItems={"center"}>
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
          <MDButton
            color="dark"
            style={{ height: 30, marginLeft: 20 }}
            onClick={async () => {
              setIsLoading(true);
              setModulesSearchQuery(searchParams);
              await getAllModules(rowsPerPage, 0);
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
    <DashboardLayout>
      <DashboardNavbar />
      <ModuleDetails ModuleId={id} />;
    </DashboardLayout>
  );
};
