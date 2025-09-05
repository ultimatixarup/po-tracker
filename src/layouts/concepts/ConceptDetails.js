import { MuiTable } from "../../components/DataTable";
import { useContext, useEffect, useState } from "react";
import { Box } from "@mui/material";
import MDTypography from "../../components/ui/MDTypography";
import { LoaderContext } from "../../index";
import { useAppStore } from "../../lib/store/appStore";
import boxShadows from "assets/theme/base/boxShadows";
import typography from "assets/theme/base/typography";
import moment from "moment";
import MuiTabs from "../../components/Tabs/index";
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";
import axios from "axios";
import LinkItemDialog from "../../components/Tables/forms/LinkItemDialog";
const { sliderBoxShadow } = boxShadows;
const { size } = typography;
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TableChartIcon from "@mui/icons-material/TableChart";
import TableRowsIcon from "@mui/icons-material/TableRows";
import AddEditConceptForm from "../../components/Tables/forms/AddEditConceptForm";
import MDBox from "../../components/ui/MDBox";
import { TabItems } from "../../lib/utils";
import { settings } from "lib/settings";
import { SupportMaterialEnum, PatentStatusEnum } from "lib/utils";

const ConceptDetails = ({ conceptId = null }) => {
  if (!conceptId) return;
  conceptId = conceptId?.toString();
  let mode = null;
  if (conceptId?.toLowerCase().includes("add")) {
    mode = "add";
  } else if (conceptId?.toLowerCase().includes("edit")) {
    mode = "edit";
    conceptId = conceptId.split("-")[1];
  }
  const { setIsLoading } = useContext(LoaderContext);
  const [openLinkItemDialog, setOpenLinkItemDialog] = useState({});
  const {
    getConceptByIdAction,
    conceptInfo,
    getSubsystems,
    subSystems,
    getSupportMaterials,
    supportMaterials,
    getAuthors,
    authors,
    getPatents,
    patents,
    getTRLAdvancements,
    trlAdvancements,
    getBusinessImpacts,
    resetDefaultItems,
    getConceptFunctions,
    resetConceptinfo,
  } = useAppStore((state) => state);
  const [view, setView] = useState("sections");

  useEffect(() => {
    async function fetchConcepts() {
      if (!isNaN(conceptId)) {
        resetDefaultItems();
        setIsLoading(true);
        getConceptByIdAction(conceptId);
        getSubsystems(conceptId);
        getSupportMaterials(conceptId);
        getAuthors(conceptId);
        getPatents(conceptId);
        getTRLAdvancements(conceptId);
        setIsLoading(false);
      }
    }
    fetchConcepts();
    return () => {
      resetConceptinfo();
    };
  }, []);

  const TableActions = Object.freeze({
    ADD: "Add",
    EDIT: "Edit",
    DELETE: "Delete",
    LINK: "Link",
    UNLINK: "Unlink",
  });

  const handleViewChange = (event, nextView) => {
    setView(nextView);
  };
  const SubsystemTable = () => {
    const rows = subSystems
      ? subSystems.map((row) => {
          const { id, name } = row;
          return {
            id,
            name,
            actions: (
              <Actions
                actionType={TableActions.UNLINK}
                itemId={row.id}
                itemName={TabItems.SUBSYSTEMS}
              />
            ),
          };
        })
      : [];

    const columns = [
      { name: "id", label: "Id" },
      { name: "name", label: "Name" },
      {
        name: "actions",
        options: { align: "right" },
        label: "",
        children: (
          <Actions actionType={TableActions.LINK} itemId={null} itemName={TabItems.SUBSYSTEMS} />
        ),
      },
    ];

    return <MuiTable data={rows} columns={columns} />;
  };
  const SupportMaterialsTable = () => {
    const rows = supportMaterials
      ? supportMaterials?.map((row) => {
          const { id, title, type, location } = row;
          return {
            id,
            title,
            type: SupportMaterialEnum[type],
            location,
            actions: (
              <Actions
                actionType={TableActions.UNLINK}
                itemId={row.id}
                itemName={TabItems.SUPPORT_MATERIALS}
              />
            ),
          };
        })
      : [];

    const columns = [
      { name: "id", label: "Id" },
      { name: "title", label: "Material Title" },
      { name: "type", label: "Material Type" },
      { name: "location", label: "Material Location" },
      {
        name: "actions",
        label: "",
        options: { align: "right" },
        children: (
          <Actions
            actionType={TableActions.LINK}
            itemId={null}
            itemName={TabItems.SUPPORT_MATERIALS}
          />
        ),
      },
    ];

    return <MuiTable data={rows} columns={columns} />;
  };
  const AuthorsTable = () => {
    const rows = authors
      ? authors.map((row) => {
          const { id, name, initial } = row;
          return {
            id,
            name,
            initial,
            actions: (
              <Actions
                actionType={TableActions.UNLINK}
                itemId={row.id}
                itemName={TabItems.AUTHORS}
              />
            ),
          };
        })
      : [];

    const columns = [
      { name: "id", label: "Id" },
      { name: "name", label: "Name" },
      { name: "initial", label: "Initial" },
      {
        name: "actions",
        label: "",
        options: { align: "right" },
        children: (
          <Actions actionType={TableActions.LINK} itemId={null} itemName={TabItems.AUTHORS} />
        ),
      },
    ];

    return <MuiTable data={rows} columns={columns} />;
  };
  const PatentsTable = () => {
    const rows = patents
      ? patents.map((row) => {
          const { id, author, idf_date, status, filed_date, patented_date, description } = row;
          return {
            id,
            author,
            idf_date: idf_date ? moment(idf_date).format("MM/DD/YYYY") : "",
            status: PatentStatusEnum[status],
            filed_date: filed_date ? moment(filed_date).format("MM/DD/YYYY") : "",
            patented_date: patented_date ? moment(patented_date).format("MM/DD/YYYY") : "",
            description,
            actions: (
              <Actions
                actionType={TableActions.UNLINK}
                itemId={row.id}
                itemName={TabItems.PATENTS}
              />
            ),
          };
        })
      : [];

    const columns = [
      { name: "id", label: "Id" },
      { name: "author", label: "Author" },
      { name: "idf_date", label: "IDF Submission Date" },
      { name: "status", label: "IDF Status" },
      { name: "filed_date", label: "Filed Date" },
      { name: "patented_date", label: "Patented Date" },
      { name: "description", label: "Description", options: { width: "200px" } },
      {
        name: "actions",
        label: "",
        options: { align: "right" },
        children: (
          <Actions actionType={TableActions.LINK} itemId={null} itemName={TabItems.PATENTS} />
        ),
      },
    ];

    return <MuiTable data={rows} columns={columns} />;
  };
  const TrlAdvancementsTable = () => {
    const rows = trlAdvancements
      ? trlAdvancements.map((row) => {
          const { id, title, description, date } = row;
          return {
            id,
            title,
            description,
            date: date ? moment(date).format("MM/DD/YYYY") : "",
            actions: (
              <Actions
                actionType={TableActions.UNLINK}
                itemId={row.id}
                itemName={TabItems.TRL_ADVANCEMENTS}
              />
            ),
          };
        })
      : [];

    const columns = [
      { name: "id", label: "Id" },
      { name: "title", label: "Current TRL" },
      { name: "description", label: "Next Steps" },
      { name: "date", label: "Activity Date" },
      {
        name: "actions",
        label: "",
        options: { align: "right" },
        children: (
          <Actions
            actionType={TableActions.LINK}
            itemId={null}
            itemName={TabItems.TRL_ADVANCEMENTS}
          />
        ),
      },
    ];

    return <MuiTable data={rows} columns={columns} />;
  };

  const tabs = [
    {
      name: TabItems.SUBSYSTEMS,
      label: "Subsystems",
      children: <SubsystemTable />,
    },
    {
      name: TabItems.SUPPORT_MATERIALS,
      label: "Support Materials",
      children: <SupportMaterialsTable />,
    },
    {
      name: TabItems.AUTHORS,
      label: "Authors",
      children: <AuthorsTable />,
    },
    {
      name: TabItems.PATENTS,
      label: "Patents",
      children: <PatentsTable />,
    },
    {
      name: TabItems.TRL_ADVANCEMENTS,
      label: "TRL Advancements",
      children: <TrlAdvancementsTable />,
    },
  ];
  const onTabIndexChange = async (event, newValue) => {
    const tabName = event.target.name;

    switch (tabName) {
      case TabItems.SUBSYSTEMS:
        await getSubsystems(conceptId);
        break;
      case TabItems.SUPPORT_MATERIALS:
        await getSupportMaterials(conceptId);
        break;
      case TabItems.AUTHORS:
        await getAuthors(conceptId);
        break;
      case TabItems.PATENTS:
        await getPatents(conceptId);
        break;
      case TabItems.TRL_ADVANCEMENTS:
        await getTRLAdvancements(conceptId);
      default:
        await getSubsystems(conceptId);
        break;
    }
    console.log(newValue, event.target.name);
  };
  const onLinkItemDialogClose = () => {
    onTabIndexChange({ target: { name: openLinkItemDialog?.itemName } });
    setOpenLinkItemDialog({});
  };
  const unLinkItemAction = async ({ itemId, itemName }) => {
    let unlinkEndpoint = "";
    switch (itemName) {
      case TabItems.SUBSYSTEMS:
        unlinkEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/subsystems/${itemId}`;
        break;
      case TabItems.SUPPORT_MATERIALS:
        unlinkEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/supportmaterials/${itemId}`;
        break;
      case TabItems.AUTHORS:
        unlinkEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/employees/${itemId}`;
        break;
      case TabItems.PATENTS:
        unlinkEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/patents/${itemId}`;
        break;
      case TabItems.TRL_ADVANCEMENTS:
        unlinkEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/trls/${itemId}`;
        break;
      default:
        break;
    }

    setIsLoading(true);
    const accessToken = localStorage.getItem("accessToken");
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    await axios
      .delete(unlinkEndpoint, config)
      .then(function (response) {
        setIsLoading(false);
        onTabIndexChange({ target: { name: itemName } });
      })
      .catch(function (error) {
        setIsLoading(false);
        console.log(error.toJSON());
        setIsLoading(false);
      });
  };
  const RenderConceptDetails = ({ label, value }) => {
    return (
      <MDTypography
        sx={({ typography: { size }, borders: { borderWidth } }) => ({
          fontSize: size.sm,
          fontWeight: "normal",
        })}
      >
        <strong>{label}:</strong> {value}
      </MDTypography>
    );
  };
  const SectionHeading = ({ heading }) => {
    return (
      <MDBox
        mb={2}
        mt={2}
        py={1}
        px={1}
        variant="gradient"
        bgColor="info"
        borderRadius="lg"
        coloredShadow="info"
      >
        <MDTypography variant="h6" color="white">
          {heading}
        </MDTypography>
      </MDBox>
    );
  };
  const Actions = ({ actionType, itemId, itemName }) => {
    return (
      <MDTypography
        sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
          fontSize: size.sm, //size.sm
        })}
        component="a"
        href="javascript:void(0)"
        variant="caption"
        color="text"
        fontWeight="medium"
        onClick={
          actionType === TableActions.LINK
            ? () => setOpenLinkItemDialog({ open: true, conceptId: conceptId, itemName })
            : () => unLinkItemAction({ conceptId, itemId, itemName })
        }
      >
        {actionType === TableActions.LINK ? (
          <Box>
            <Tooltip title={"Add " + itemName}>
              <Icon fontSize="small" color="success">
                add_circle
              </Icon>
            </Tooltip>
          </Box>
        ) : (
          <Box>
            <Tooltip title={"Delete " + itemName}>
              <Icon fontSize="small" color="error">
                delete
              </Icon>
            </Tooltip>
          </Box>
        )}
      </MDTypography>
    );
  };

  return (
    <>
      <LinkItemDialog
        open={openLinkItemDialog.open}
        onClose={onLinkItemDialogClose}
        data={openLinkItemDialog}
      />
      <Box display="flex" justifyContent="space-between">
        {/* style={{ padding: 5, boxShadow: sliderBoxShadow.thumb }} */}
        {mode !== "add" && mode !== "edit" && (
          <Box className="concept-info" display="flex" flexDirection="column" gap={1} pb={2}>
            <RenderConceptDetails label="Inscope" value={conceptInfo?.inscope} />
            <RenderConceptDetails label="Title" value={conceptInfo?.title} />
            <RenderConceptDetails label="Status" value={conceptInfo?.status} />
            <RenderConceptDetails label="Description" value={conceptInfo?.description} />
          </Box>
        )}
        {(mode === "add" || mode === "edit") && <AddEditConceptForm conceptId={conceptId} />}
        <Box>
          <ToggleButtonGroup
            orientation="horizontal"
            exclusive
            onChange={handleViewChange}
            value={view}
          >
            <ToggleButton value="sections" aria-label="sections">
              <Tooltip title="Switch to Section View">
                <TableRowsIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="tabs" aria-label="tabs">
              <Tooltip title="Switch to Tabs View">
                <TableChartIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      {view === "tabs" && mode !== "add" && (
        <Box sx={{ borderBottom: 0, borderColor: "divider" }}>
          <MuiTabs tabs={tabs} onTabIndexChange={onTabIndexChange} />
        </Box>
      )}
      {view === "sections" &&
        mode !== "add" &&
        tabs &&
        tabs.map((tab) => (
          <>
            <SectionHeading heading={tab.label} />
            {tab.children}
          </>
        ))}
    </>
  );
};

export default ConceptDetails;
