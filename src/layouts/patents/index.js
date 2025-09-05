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
import { PatentStatusEnum } from "lib/utils";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { MuiTable } from "../../components/DataTable";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";

const PatentsComponent = () => {
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
              Patents
            </MDTypography>
          </MDBox>
          <MDBox pt={3}>
            <PatentsTable />
          </MDBox>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
};

export default PatentsComponent;
const PatentsTable = () => {
  const rowsPerPage = 10;
  const [searchParams, setSearchParams] = useState();
  const { setIsLoading } = useContext(LoaderContext);
  const { getAllPatents, patents, setPatentSearchQuery } = useAppStore((state) => state);
  useEffect(() => {
    async function fetchPatents() {
      setIsLoading(true);
      await getAllPatents(rowsPerPage, 0);
      setIsLoading(false);
    }
    fetchPatents();
  }, []);

  const handlePageChange = async ({ pageIndex, pageSize }) => {
    setIsLoading(true);
    let offset = pageIndex > 0 ? pageIndex * pageSize : 0;
    await getAllPatents(pageSize, offset);
    setIsLoading(false);
  };

  const onKeyDownAction = (ev) => {
    if (ev.key === "Enter") {
      //Search
      setPatentSearchQuery(searchParams);
      getAllPatents(rowsPerPage, 0);
      ev.preventDefault();
    }
  };
  const clearSearchAction = () => {
    setSearchParams();
    setPatentSearchQuery();
    getAllPatents(rowsPerPage, 0);
  };

  const patentRows = patents?.patents;
  const rows =
    patentRows && Array.isArray(patentRows)
      ? patentRows.map((row) => {
          const { id, filed_date, patented_date, description, idf_date, status, author } = row;
          return {
            id,

            filed_date: filed_date ? moment(filed_date).format("MM/DD/YYYY") : "",
            patented_date: patented_date ? moment(patented_date).format("MM/DD/YYYY") : "",
            description,
            idf_date: idf_date ? moment(idf_date).format("MM/DD/YYYY") : "",
            status: PatentStatusEnum[status],
            author,
          };
        })
      : [];

  const columns = [
    {
      name: "id",
      label: "ID",
    },
    {
      name: "filed_date",
      label: "Filed Date",
      children: (
        <TextField
          value={searchParams?.filed_date || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, filed_date: e.target.value })}
        />
      ),
    },
    {
      name: "patented_date",
      label: "Patented Date",
      children: (
        <TextField
          value={searchParams?.patented_date || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, patented_date: e.target.value })}
        />
      ),
    },
    {
      name: "description",
      label: "Description",
      children: (
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
      ),
    },
    {
      name: "idf_date",
      label: "Submission Date",
      children: (
        <TextField
          value={searchParams?.idf_date || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, idf_date: e.target.value })}
        />
      ),
    },
    {
      name: "status",
      label: "Status",
      children: (
        <TextField
          value={searchParams?.status || ""}
          inputProps={{
            style: {
              height: "0.4375em",
            },
          }}
          fullWidth
          margin="dense"
          variant="outlined"
          onKeyDown={onKeyDownAction}
          onChange={(e) => setSearchParams({ ...searchParams, status: e.target.value })}
        />
      ),
    },
    {
      name: "author",
      label: "Author",
      children: (
        <Box display={"flex"} alignItems={"center"}>
          <TextField
            value={searchParams?.author || ""}
            inputProps={{
              style: {
                height: "0.4375em",
              },
            }}
            fullWidth
            margin="dense"
            variant="outlined"
            onKeyDown={onKeyDownAction}
            onChange={(e) => setSearchParams({ ...searchParams, author: e.target.value })}
          />
          <MDButton
            color="dark"
            style={{ height: 30, marginLeft: 20 }}
            onClick={async () => {
              setIsLoading(true);
              setPatentSearchQuery(searchParams);
              await getAllPatents(rowsPerPage, 0);
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
      totalCount={patents?.totalCount || null}
      options={{ rowsPerPage: rowsPerPage }}
      onPageChange={(args) => handlePageChange(args)}
    />
  );
};
