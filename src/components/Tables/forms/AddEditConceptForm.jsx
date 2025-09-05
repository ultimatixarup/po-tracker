import React, { useContext, useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import MDButton from "components/ui/MDButton";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { LoaderContext } from "index";
import * as Yup from "yup";
import axios from "axios";
import { useAppStore } from "lib/store/appStore";
import { useNavigate } from "react-router-dom";
import { ConceptsStatusEnum } from "lib/utils";
import { settings } from "lib/settings";

const AddEditConceptForm = ({ conceptId }) => {
  const { setIsLoading } = useContext(LoaderContext);
  const { resetConceptinfo, conceptInfo, getConceptByIdAction } = useAppStore((state) => state);
  const navigate = useNavigate();
  let mode = null;
  if (conceptId.toLowerCase().includes("add")) {
    mode = "add";
    conceptId = null;
  } else if (conceptId.toLowerCase().includes("edit")) {
    mode = "edit";
    conceptId = conceptId.split("-")[1];
  }
  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    status: Yup.string().required("Status is required"),
    description: Yup.string().required("Description is required"),
    inscope: Yup.string().required("Inscope is required"),
  });
  const initialValues = {
    title: "",
    status: "",
    description: "",
    inscope: "",
  };
  const formOptions = {
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: initialValues,
    resolver: yupResolver(validationSchema),
  };

  const { register, handleSubmit, formState, reset, getValues, setValue } = useForm(formOptions);
  const { errors } = formState;
  useEffect(() => {
    async function fetchConceptById() {
      if (conceptId) {
        setIsLoading(true);
        await getConceptByIdAction(conceptId);
        setIsLoading(false);
      } else {
        reset(initialValues);
        resetConceptinfo();
      }
    }
    fetchConceptById();
  }, [conceptId]);

  useEffect(() => {
    if (conceptInfo !== null) {
      reset({
        ...conceptInfo,
      });
    } else {
      reset(initialValues);
    }
  }, [conceptInfo]);
  const onSubmit = async (data) => {
    const { id, created_at, updated_at, created_by, updated_by, ...postinfo } = data;
    const accessToken = localStorage.getItem("accessToken");
    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
    if (conceptId !== null) {
      await axios
        .put(`${settings.SERVICE_URL}/api/v1/concepts/${conceptInfo.id}`, postinfo, config)
        .then(function (response) {
          reset();
          alert("Concept Updated!");
          setIsLoading(true);
          getConceptByIdAction(conceptId);
          setIsLoading(false);
        })
        .catch(function (error) {
          alert("Error: Updating Concept! " + error.response.data);
          setIsLoading(false);
        });
    } else {
      await axios
        .post(`${settings.SERVICE_URL}/api/v1/concepts`, postinfo, config)
        .then(function (response) {
          alert("Concept Added!");
          navigate(`/concepts/edit-${response?.data?.id}`);
          setIsLoading(false);
          reset();
        })
        .catch(function (error) {
          alert("Error: Adding Concept! " + error.response.data);
          setIsLoading(false);
        });
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
      <Grid container>
        <Grid item xs={12} alignContent="center">
          <Grid container direction="row">
            <Grid item xs={12} spacing={2} paddingBottom={5}>
              <Typography variant="h5">
                {mode === "edit" ? "Edit" : "Add"} Concept Details
              </Typography>
            </Grid>
          </Grid>
          <Grid container direction="row" spacing={2}>
            <Grid item xs={6}>
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
            <Grid item xs={6}>
              <TextField
                select
                size="medium"
                variant="outlined"
                fullWidth
                margin="dense"
                id="status"
                name="status"
                label="Status"
                error={!!errors?.status}
                helperText={errors?.status ? errors?.status?.message : ""}
                InputLabelProps={{
                  shrink: true,
                }}
                SelectProps={{
                  style: { height: 50 },
                }}
                value={getValues("status")}
                onChange={(e) => setValue("status", e.target.value, { shouldValidate: true })}
              >
                {Object.keys(ConceptsStatusEnum).map((key, index) => (
                  <MenuItem value={key} key={key}>
                    {ConceptsStatusEnum[key]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
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
            <Grid item xs={6}>
              <TextField
                fullWidth
                margin="dense"
                multiline
                rows="1"
                id="description"
                name="description"
                label="Description"
                error={!!errors?.description}
                helperText={errors?.description ? errors?.description?.message : ""}
                variant="outlined"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                {...register("description", { required: true })}
              />
            </Grid>
          </Grid>
          <Grid container className="mt-auto" padding={2}>
            <Grid item container>
              <Grid item xs={6}>
                <Button onClick={() => reset()} variant="contained" type="submit">
                  Reset
                </Button>
              </Grid>

              <Grid item xs={6} align="right">
                <MDButton type="submit" color="dark">
                  SAVE
                </MDButton>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </form>
  );
};

export default AddEditConceptForm;
