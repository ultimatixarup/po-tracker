import React, { useContext, useEffect } from "react";
import { MenuItem } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Icon from "@mui/material/Icon";
import MDButton from "components/ui/MDButton";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoaderContext } from "index";
import * as Yup from "yup";
import axios from "axios";
import { useAppStore } from "lib/store/appStore";
import { settings } from "lib/settings";
function AddConceptDialog(props) {
  const { open, onClose } = props;
  const { setIsLoading } = useContext(LoaderContext);
  const { getConceptsAction, editConceptInfo, editConceptAction } = useAppStore((state) => state);

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    status: Yup.string().required("Status is required"),
    description: Yup.string().required("Description is required"),
    inscope: Yup.string().required("Inscope is required"),
    // created_at: Yup.string().required("Creation Date is required"),
    // updated_at: Yup.string().required("Modification Date is required"),
  });
  const { id, ...editValues } = editConceptInfo || {};
  const defaultValues = {
    title: "",
    status: "",
    description: "",
    inscope: "",
  };
  const formOptions = {
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues,
  };

  const { register, handleSubmit, formState, reset } = useForm(formOptions);
  const { errors } = formState;
  useEffect(() => {
    if (editConceptInfo !== null) {
      reset(editValues);
    }
  }, [editConceptInfo]);
  const onSubmit = async (data) => {
    if (editConceptInfo !== null) {
      console.log(data);
      const accessToken = localStorage.getItem("accessToken");
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
      };
      console.log("this is daataa", data);
      await axios
        .put(`${settings.SERVICE_URL}/api/v1/concepts/${editConceptInfo.id}`, data, config)
        .then(function (response) {
          reset();
          alert("Concept Updated!");
          setIsLoading(false);
          reset();
          onModalClose();
        })
        .catch(function (error) {
          alert("Error: Updating Concept! " + error.response.data);
          setIsLoading(false);
        });
      setIsLoading(true);
      await getConceptsAction();
      setIsLoading(false);
    } else {
      console.log(data);
      const accessToken = localStorage.getItem("accessToken");
      const config = {
        headers: { Authorization: `Bearer ${accessToken}` },
      };
      await axios
        .post(`${settings.SERVICE_URL}/api/v1/concepts`, data, config)
        .then(function (response) {
          alert("Concept Added!");
          setIsLoading(false);
          reset();
        })
        .catch(function (error) {
          alert("Error: Adding Concept! " + error.response.data);
          setIsLoading(false);
        });
      setIsLoading(true);
      await getConceptsAction();
      setIsLoading(false);
    }
  };
  const onModalClose = () => {
    reset(defaultValues);
    if (editConceptAction !== null) {
      onClose("addConceptModal");
      editConceptAction(null);
    }
  };
  return (
    <Dialog fullWidth maxWidth="md" open={open || editConceptInfo != null} onClose={onModalClose}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container>
            <Grid item xs={12} alignContent="center">
              <Grid container direction="row">
                <Grid item xs={10} spacing={2} paddingBottom={5}>
                  <Typography variant="h5">Add Concept Details</Typography>
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
                  <TextField
                    fullWidth
                    margin="dense"
                    id="title"
                    name="title"
                    label="Title"
                    error={!!errors?.title}
                    helperText={errors?.title ? errors.title?.message : ""}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    {...register("title", { required: true })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    id="status"
                    name="status"
                    label="Status"
                    error={!!errors?.status}
                    helperText={errors?.status ? errors?.status?.message : ""}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    {...register("status", { required: true })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    type="number"
                    fullWidth
                    margin="dense"
                    id="inscope"
                    name="inscope"
                    label="Inscope"
                    error={!!errors?.inscope}
                    helperText={errors?.inscope ? errors?.inscope?.message : ""}
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    {...register("inscope", { required: true })}
                  />
                </Grid>
                {editConceptInfo === null && (
                  <Grid container direction="row" padding={2}>
                    <Grid item xs={2}></Grid>
                    <Grid item xs={5}>
                      <TextField
                        fullWidth
                        error={!!errors?.updated_at}
                        variant="outlined"
                        type="date"
                        defaultValue="2024-03-02"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    multiline
                    rows="5"
                    id="description"
                    name="description"
                    label="Description"
                    error={!!errors?.description}
                    helperText={errors?.description ? errors?.description?.message : ""}
                    variant="outlined"
                    type="date"
                    defaultValue="2024-03-02"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    {...register("description", { required: true })}
                  />
                </Grid>
              </Grid>
              <Grid container className="mt-auto" padding={2}>
                <Grid item container>
                  <Grid item xs={4}>
                    <MDButton color="dark" onClick={onModalClose}>
                      Cancel
                    </MDButton>
                  </Grid>
                  <Grid item xs={4} align="center">
                    <Button onClick={() => reset()} variant="contained" type="submit">
                      Reset
                    </Button>
                  </Grid>

                  <Grid item xs={4} align="right">
                    <MDButton type="submit" color="dark">
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

export default AddConceptDialog;
