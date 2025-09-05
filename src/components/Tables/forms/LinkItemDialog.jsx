import { useContext, useEffect, useState } from "react";
import { MenuItem } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import MDButton from "components/ui/MDButton";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoaderContext } from "index";
import * as Yup from "yup";
import axios from "axios";
import Select from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import { TabItems, SupportMaterialEnum } from "../../../lib/utils";
import { settings } from "lib/settings";

function LinkItemDialog(props) {
  let accessToken = localStorage.getItem("accessToken");

  const [selectedLinkItems, setSelectedLinkItems] = useState([]);

  const { open, onClose, data } = props;
  let { itemName, conceptId } = data;

  const { setIsLoading } = useContext(LoaderContext);

  const [items, setItems] = useState();
  const validationSchema = Yup.object().shape({
    itemId: Yup.string().required("Required Field"),
  });
  const defaultValues = {
    itemId: "",
  };
  const formOptions = {
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues,
  };

  const { register, handleSubmit, formState, reset } = useForm(formOptions);
  const { errors } = formState;
  useEffect(() => {
    if (open) {
      getItemsData({ itemName });
    }
  }, [open, data]);

  const getItemsURL = (itemName) => {
    let itemsEndpoint = "";
    switch (itemName) {
      case TabItems.SUBSYSTEMS:
        itemsEndpoint = `${settings.SERVICE_URL}/api/v1/subsystems`;
        break;
      case TabItems.SUPPORT_MATERIALS:
        itemsEndpoint = `${settings.SERVICE_URL}/api/v1/supportmaterials`;
        break;
      case TabItems.AUTHORS:
        itemsEndpoint = `${settings.SERVICE_URL}/api/v1/employees`;
        break;
      case TabItems.PATENTS:
        itemsEndpoint = `${settings.SERVICE_URL}/api/v1/patents`;
        break;
      case TabItems.TRL_ADVANCEMENTS:
        itemsEndpoint = `${settings.SERVICE_URL}/api/v1/trls`;
        break;
      default:
        break;
    }
    return itemsEndpoint;
  };
  const formatAutoCompleteData = (itemName, data) => {
    let resultData = null;
    switch (itemName) {
      case TabItems.SUBSYSTEMS:
        resultData = [{ itemId: null, title: "title" }].concat(
          data?.subsystems.map((d) => ({ itemId: d.id, title: d.name }))
        );
        break;
      case TabItems.SUPPORT_MATERIALS:
        resultData = [{ itemId: null, title: "title", type: null, location: null }].concat(
          data?.supportMaterials?.map((d) => ({
            itemId: d.id,
            title: d.title,
            type: SupportMaterialEnum[d.type],
            location: d.location,
          }))
        );

        break;
      case TabItems.AUTHORS:
        resultData = [{ itemId: null, title: "title", initial: null }].concat(
          data?.employees.map((d) => ({
            itemId: d.id,
            title: d.name,
            initial: d.initial,
          }))
        );
        break;
      case TabItems.PATENTS:
        resultData = [{ itemId: null, title: "title", author: null }].concat(
          data?.patents?.map((d) => ({
            itemId: d.id,
            title: d.description,
            author: d.author,
          }))
        );
        break;
      case TabItems.TRL_ADVANCEMENTS:
        resultData = [{ itemId: null, title: "title", description: null }].concat(
          data?.trls?.map((d) => ({
            itemId: d.id,
            title: d.title,
            description: d.description,
          }))
        );
        break;
      default:
        break;
    }

    return resultData;
  };
  const getItemsData = async ({ itemName }) => {
    const config = {
      headers: { Authorization: accessToken ? `Bearer ${accessToken}` : "" },
    };
    const itemsEndpoint = getItemsURL(itemName);
    setIsLoading(true);
    await axios
      .get(itemsEndpoint, {}, config)
      .then(function (response) {
        const data = formatAutoCompleteData(itemName, response.data);
        setItems(data);
        setIsLoading(false);
      })
      .catch(function (error) {
        setIsLoading(false);
        alert("Error:" + error.response.data);
      });
  };

  const onSubmit = async (data) => {
    // const { itemId } = data;
    let payload = {};
    let linkItemsEndpoint = "";
    switch (itemName) {
      case TabItems.SUBSYSTEMS:
        linkItemsEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/subsystems`;
        payload = { subsystems: data };
        break;
      case TabItems.SUPPORT_MATERIALS:
        linkItemsEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/supportmaterials`;
        payload = { supportmaterial: data };
        break;
      case TabItems.AUTHORS:
        linkItemsEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/employees`;
        payload = { employees: data };
        break;
      case TabItems.PATENTS:
        linkItemsEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/patents`;
        payload = { patents: data };
        break;
      case TabItems.TRL_ADVANCEMENTS:
        linkItemsEndpoint = `${settings.SERVICE_URL}/api/v1/concepts/${conceptId}/trls`;
        payload = { trl: data };
        break;
      default:
        break;
    }
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    await axios
      .put(linkItemsEndpoint, payload, config)
      .then(function (response) {
        setSelectedLinkItems([]);
        onModalClose();
      })
      .catch(function (error) {
        alert("Error: Linking! " + error.response.data);
      });
  };
  const onModalClose = () => {
    reset(defaultValues);
    onClose("linkItemModal");
  };
  const isAllSelected = items?.length > 0 && selectedLinkItems.length === items?.length;
  const handleChange = (event) => {
    const value = event.target.value;
    if (value[value.length - 1] === "all") {
      setSelectedLinkItems(
        selectedLinkItems.length === items.length ? [] : items.map((o) => o.itemId)
      );
      return;
    }
    setSelectedLinkItems(value);
    console.log(selectedLinkItems);
  };
  return (
    <Dialog maxWidth="md" open={open} onClose={onModalClose} fullWidth>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container>
            <Grid item xs={12} alignContent="center">
              <Grid container direction="row">
                <Grid item xs={10} spacing={2} paddingBottom={5}>
                  <Typography variant="h5">Add {itemName}</Typography>
                </Grid>
                <Grid item xs={2} align="right">
                  <IconButton
                    onClick={onModalClose}
                    edge="start"
                    align="right"
                    color="inherit"
                    aria-label="Close"
                    style={{ padding: 8 }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Grid>
              </Grid>
              <Grid container direction="row" spacing={2}>
                <Grid item xs={12}>
                  <Select
                    size="medium"
                    variant="outlined"
                    fullWidth
                    id="itemid"
                    name="itemId"
                    style={{ height: "50px" }}
                    multiple
                    placeholder="--Select--"
                    value={selectedLinkItems}
                    onChange={handleChange}
                    renderValue={(selected) =>
                      selectedLinkItems
                        .map((s) => items.find((o) => o.itemId === s)?.title)
                        ?.filter((f) => f && f !== "title")
                        ?.join(", ")
                    }
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: {
                            xs: 100,
                            sm: 200,
                          },
                          width: { xs: 100, sm: 100 },
                          overflow: "auto",
                        },
                      },
                    }}
                  >
                    <MenuItem value="all">
                      <Checkbox
                        aria-label="All"
                        checked={isAllSelected}
                        indeterminate={
                          selectedLinkItems.length > 0 && selectedLinkItems.length < items.length
                        }
                        All
                      />
                    </MenuItem>
                    {items?.map((option, index) => {
                      let keys = Object.keys(option);
                      const isChecked =
                        selectedLinkItems?.find((s) => s === option?.itemId) !== undefined;
                      return (
                        <MenuItem
                          component="tr"
                          cellspacing="5px"
                          style={{ tableLayout: "fixed" }}
                          key={`menuItem_${option.value}`}
                          value={option.itemId}
                        >
                          {index === 0 ? (
                            <>
                              {keys.map((key, indexHeader) => (
                                <th
                                  width={indexHeader == 0 ? 100 : 200}
                                  key={`header-${indexHeader}`}
                                >
                                  {key.toUpperCase()}
                                </th>
                              ))}
                            </>
                          ) : (
                            <>
                              {keys.map((key, indexInner) =>
                                indexInner > 0 ? (
                                  <td width={200} key={indexInner} style={{ whiteSpace: "normal" }}>
                                    {option[key]}
                                  </td>
                                ) : (
                                  <td
                                    width={100}
                                    key={indexInner}
                                    align="left"
                                    style={{ whiteSpace: "normal" }}
                                  >
                                    <Checkbox checked={isChecked} />
                                    {option[key]}
                                  </td>
                                )
                              )}
                            </>
                          )}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </Grid>
              </Grid>
              <Grid container className="mt-auto" padding={2}>
                <Grid item container>
                  <Grid item xs={4}>
                    <MDButton color="warning" onClick={onModalClose}>
                      Cancel
                    </MDButton>
                  </Grid>
                  <Grid item xs={4} align="center">
                    <MDButton
                      onClick={() => reset()}
                      variant="contained"
                      type="submit"
                      color="secondary"
                    >
                      Reset
                    </MDButton>
                  </Grid>

                  <Grid item xs={4} align="right">
                    <MDButton
                      type="submit"
                      color="primary"
                      onClick={() => onSubmit(selectedLinkItems?.filter((s) => s !== null))}
                    >
                      SAVE
                    </MDButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default LinkItemDialog;
