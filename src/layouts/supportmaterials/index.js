import { useAuth0 } from "@auth0/auth0-react";
import { Box } from "@mui/material";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import MDButton from "components/ui/MDButton";
import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import { SupportMaterialEnum } from "lib/utils";
import { useContext, useEffect, useState } from "react";
import { MuiTable } from "../../components/DataTable";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";

const SupportMaterialsComponent = () => {
  const { isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return null;
  }
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SupportMaterialsTable />
    </DashboardLayout>
  );
};

const SupportMaterialsTable = () => {
  const rowsPerPage = 10;
  const [searchParams, setSearchParams] = useState();
  const { setIsLoading } = useContext(LoaderContext);
  const { getAllSupportMaterials, supportMaterials, setSupportMaterialSearchQuery } = useAppStore(
    (state) => state
  );
  useEffect(() => {
    async function fetchSupportMaterials() {
      setIsLoading(true);
      await getAllSupportMaterials(rowsPerPage, 0);
      setIsLoading(false);
    }
    fetchSupportMaterials();
  }, []);

  const handlePageChange = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    let offset = pageIndex > 0 ? pageIndex * pageSize : 0;
    await getAllSupportMaterials(pageSize, offset);
    setIsLoading(false);
  };

  const onKeyDownAction = (ev) => {
    if (ev.key === "Enter") {
      //Search
      setSupportMaterialSearchQuery(searchParams);
      getAllSupportMaterials(rowsPerPage, 0);
      ev.preventDefault();
    }
  };
  const clearSearchAction = () => {
    setSearchParams();
    setSupportMaterialSearchQuery();
    getAllSupportMaterials(rowsPerPage, 0);
  };

  const supportMaterialRows = supportMaterials?.supportMaterials;
  const rows =
    supportMaterialRows && Array.isArray(supportMaterialRows)
      ? supportMaterialRows.map((row) => {
          const { id, title, type, location } = row;
          return {
            id,
            title,
            type: SupportMaterialEnum[type],
            location,
          };
        })
      : [];

  const columns = [
    { name: "id", label: "ID" },
    {
      name: "title",
      label: "Title",
      children: (
        <TextField
          value={searchParams?.title || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, title: e.target.value })}
        />
      ),
    },
    {
      name: "type",
      label: "Type",
      children: (
        <TextField
          value={searchParams?.type || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
        />
      ),
    },
    {
      name: "location",
      label: "Location",
      children: (
        <Box display={"flex"} alignItems={"center"}>
          <TextField
            value={searchParams?.location || ""}
            inputProps={{
              style: {
                height: "0.4375em",
              },
            }}
            fullWidth
            margin="dense"
            variant="outlined"
            onKeyDown={onKeyDownAction}
            onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
          />
          <MDButton
            color="dark"
            style={{ height: 30, marginLeft: 20 }}
            onClick={async () => {
              setIsLoading(true);
              setSupportMaterialSearchQuery(searchParams);
              await getAllSupportMaterials(rowsPerPage, 0);
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
      totalCount={supportMaterials?.totalCount || null}
      options={{ rowsPerPage: rowsPerPage }}
      onPageChange={(args) => handlePageChange(args)}
    />
  );
};

export default SupportMaterialsComponent;
