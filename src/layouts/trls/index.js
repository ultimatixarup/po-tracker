import { useAuth0 } from "@auth0/auth0-react";
import { Box } from "@mui/material";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import MDButton from "components/ui/MDButton";
import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { MuiTable } from "../../components/DataTable";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";

const TrlAdvancementsComponent = () => {
  const { isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return null;
  }
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <TrlAdvancementsTable />
    </DashboardLayout>
  );
};

const TrlAdvancementsTable = () => {
  const rowsPerPage = 10;
  const [searchParams, setSearchParams] = useState();
  const { setIsLoading } = useContext(LoaderContext);
  const { getAllTrlAdvancements, trlAdvancements, setTrlSearchQuery } = useAppStore(
    (state) => state
  );
  useEffect(() => {
    async function fetchTrlAdvancements() {
      setIsLoading(true);
      await getAllTrlAdvancements();
      setIsLoading(false);
    }
    fetchTrlAdvancements();
  }, []);

  const handlePageChange = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    let offset = pageIndex > 0 ? pageIndex * pageSize : 0;
    await getAllTrlAdvancements(pageSize, offset);
    setIsLoading(false);
  };

  const onKeyDownAction = (ev) => {
    if (ev.key === "Enter") {
      //Search
      setTrlSearchQuery(searchParams);
      getAllTrlAdvancements(rowsPerPage, 0);
      ev.preventDefault();
    }
  };
  const clearSearchAction = () => {
    setSearchParams();
    setTrlSearchQuery();
    getAllTrlAdvancements(rowsPerPage, 0);
  };
  const trlRows = trlAdvancements?.trls;
  const rows =
    trlRows && Array.isArray(trlRows)
      ? trlRows.map((row) => {
          const { id, title, date, description } = row;
          return {
            id,
            title,
            date: date ? moment(date).format("MM/DD/YYYY") : "",
            description,
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
      name: "date",
      label: "Activity Date",
      children: (
        <TextField
          value={searchParams?.date || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
        />
      ),
    },
    {
      name: "description",
      label: "Description",
      children: (
        <Box display={"flex"} alignItems={"center"}>
          <TextField
            value={searchParams?.description || ""}
            inputProps={{
              style: {
                height: "0.4375em",
              },
            }}
            fullWidth
            margin="dense"
            variant="outlined"
            onKeyDown={onKeyDownAction}
            onChange={(e) => setSearchParams({ ...searchParams, description: e.target.value })}
          />
          <MDButton
            color="dark"
            style={{ height: 30, marginLeft: 20 }}
            onClick={async () => {
              setIsLoading(true);
              setTrlSearchQuery(searchParams);
              await getAllTrlAdvancements(rowsPerPage, 0);
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
      totalCount={trlAdvancements?.totalCount || null}
      options={{ rowsPerPage: rowsPerPage }}
      onPageChange={(args) => handlePageChange(args)}
    />
  );
};

export default TrlAdvancementsComponent;
