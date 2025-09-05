import { Box } from "@mui/material";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import MDAvatar from "components/ui/MDAvatar";
import MDBadge from "components/ui/MDBadge";
import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";
import { LoaderContext } from "index";
import { useAppStore } from "lib/store/appStore";
import moment from "moment";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { ConceptsStatusColorEnum, ConceptsStatusEnum } from "../../../lib/utils";
export default function data(props) {
  const { setIsLoading } = useContext(LoaderContext);
  const { conceptsInfo, deleteConceptAction, editConceptAction } = useAppStore((state) => state);

  const onViewActionClick = (conceptId) => {
    props(conceptId);
  };
  const onDeleteConceptActionClick = async (conceptId, title) => {
    setIsLoading(true);
    await deleteConceptAction(conceptId);
    setIsLoading(false);
  };
  const onEditConceptActionClick = (concept) => {
    editConceptAction(concept);
  };
  const Author = ({ image, name, email }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image} name={name} size="sm" />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
        <MDTypography variant="caption">{email}</MDTypography>
      </MDBox>
    </MDBox>
  );

  const Job = ({ title, description }) => (
    <MDBox lineHeight={1} textAlign="left">
      <MDTypography display="block" variant="caption" color="text" fontWeight="medium">
        {title}
      </MDTypography>
      <MDTypography variant="caption">{description}</MDTypography>
    </MDBox>
  );
  // const getStatusText = (status) => {
  //   switch (status) {
  //     case 1:
  //       return "Filed";
  //     case 2:
  //       return "Approved";
  //     case 3:
  //       return "Denied";
  //     case 4:
  //       return "Withdrawn";
  //     case 5:
  //       return "Reexamined";
  //     case 6:
  //       return "Reissued";
  //     case 7:
  //       return "Inactive";
  //     default:
  //       return "";
  //   }
  // };
  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case 2:
  //       return "success";
  //     case 1:
  //       return "warning";
  //     default:
  //       return "info";
  //   }
  // };

  const conceptsRows = conceptsInfo
    ? conceptsInfo.map((concept) => {
        return {
          concepTitle: (
            <MDTypography
              variant="caption"
              fontWeight="medium"
              sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                fontSize: size.sm, //size.sm
              })}
            >
              {concept.title}
            </MDTypography>
          ),
          status: (
            <MDBox
              ml={-1}
              sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                fontSize: size.sm, //size.sm
              })}
            >
              {concept.status && (
                <MDBadge
                  badgeContent={ConceptsStatusEnum[concept.status]}
                  color={ConceptsStatusColorEnum[concept.status]}
                  variant="gradient"
                  size="sm"
                />
              )}
            </MDBox>
          ),
          description: (
            <MDTypography
              variant="caption"
              fontWeight="medium"
              sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                fontSize: size.sm, //size.sm
              })}
            >
              {concept.description.trim()}
            </MDTypography>
          ),
          creationDate: (
            <MDTypography
              variant="caption"
              fontWeight="medium"
              sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                fontSize: size.sm, //size.sm
              })}
            >
              {concept.created_at && moment(concept.created_at).format("MM/DD/YYYY")}
            </MDTypography>
          ),
          modificationDate: (
            <MDTypography
              variant="caption"
              fontWeight="medium"
              sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                fontSize: size.sm, //size.sm
              })}
            >
              {concept.updated_at && moment(concept.updated_at).format("MM/DD/YYYY")}
            </MDTypography>
          ),
          action: (
            <Box display="flex" gap={2}>
              <MDTypography
                sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                  fontSize: size.sm, //size.sm
                })}
                component="a"
                href="javascript:void(0)"
                variant="caption"
                color="text"
                fontWeight="medium"
                onClick={() => onViewActionClick(concept.id)}
              >
                <Box>
                  <Tooltip title={"View Concept Details"}>
                    <Icon fontSize="small" color="success">
                      remove_red_eye
                    </Icon>
                  </Tooltip>
                </Box>
              </MDTypography>
              <MDTypography
                sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                  fontSize: size.sm, //size.sm
                })}
                component="a"
                href="javascript:void(0)"
                variant="caption"
                color="text"
                fontWeight="medium"
              >
                <Box>
                  <Tooltip title={"Edit Concept"}>
                    <Link to={`/concepts/edit-${concept?.id}`}>
                      <Icon
                        fontSize="small"
                        color="info"
                        //onClick={() => onEditConceptActionClick(concept)}
                      >
                        edit
                      </Icon>
                    </Link>
                  </Tooltip>
                </Box>
              </MDTypography>
              <MDTypography
                sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
                  fontSize: size.sm, //size.sm
                })}
                component="a"
                href="javascript:void(0)"
                variant="caption"
                color="text"
                fontWeight="medium"
              >
                <Box>
                  <Tooltip title={"Delete Concept"}>
                    <Icon
                      fontSize="small"
                      color="error"
                      onClick={() => onDeleteConceptActionClick(concept.id, concept.title)}
                    >
                      delete
                    </Icon>
                  </Tooltip>
                </Box>
              </MDTypography>
            </Box>
          ),
          rowData: concept,
        };
      })
    : [];
  return {
    columns: [
      { Header: "PMS", accessor: "PMS", width: "200px", align: "left" },
      { Header: "WBS", accessor: "WBS", align: "left" },
      { Header: "PCM", accessor: "PCM", width: "300px", align: "left" },
      { Header: "PL", accessor: "PL", align: "center" },
      { Header: "GL", accessor: "GL", align: "center" },
      { Header: "FO Project Name", accessor: "projectName", align: "center" },
      { Header: "PO Project Start", accessor: "projectStart", align: "center" },
      { Header: "WkStart", accessor: "wkStart", align: "center" },
      { Header: "Project End", accessor: "projectEnd", align: "center" },
      { Header: "WkEnd", accessor: "wkEnd", align: "center" },
      { Header: "PR Number", accessor: "prNumber", align: "center" },
      { Header: "PR Status", accessor: "prStatus", align: "center" },
      { Header: "PO", accessor: "po", align: "center" },
      { Header: "PO ManWks", accessor: "poManWks", align: "center" },
      { Header: "PR Amount", accessor: "po", align: "center" },
      { Header: "PR Wkly Rate", accessor: "po", align: "center" },
      { Header: "PO Monthly Bill Rate", accessor: "po", align: "center" },
      { Header: "action", accessor: "action", align: "center" },
    ],

    rows: conceptsRows,
  };
}
