import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";

import Footer from "components/Footer";
import DashboardLayout from "components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "components/Navbars/DashboardNavbar";
import DataTable from "components/Tables/DataTable";

import { LoaderContext } from "index";
import conceptsTableData from "layouts/concepts/data/conceptsTableData";
import projectsTableData from "layouts/concepts/data/projectsTableData";
import { useAppStore } from "lib/store/appStore";
import { useContext, useEffect, useState } from "react";

function Concepts() {
  const { setIsLoading } = useContext(LoaderContext);
  const [conceptId, setConceptId] = useState(null);
  const onViewAction = (id) => {
    setConceptId(conceptId === id ? null : id);
  };
  const { columns, rows } = conceptsTableData(onViewAction);
  const { columns: pColumns, rows: pRows } = projectsTableData();
  const { getConceptsAction } = useAppStore((state) => state);
  useEffect(() => {
    async function fetchConcepts() {
      setIsLoading(true);
      await getConceptsAction();
      setIsLoading(false);
    }
    fetchConcepts();
  }, []);
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
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
                  Concepts
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  toggleConceptId={conceptId}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Concepts;
