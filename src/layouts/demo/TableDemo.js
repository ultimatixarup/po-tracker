//TableDemo.js

import React, { useState } from "react";
import CreateIcon from "@mui/icons-material/Create";
import {
  Box,
  Button,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DoneIcon from "@mui/icons-material/Done";
import ClearIcon from "@mui/icons-material/Clear";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MDInput from "components/ui/MDInput";

function TableDemo() {
  const [rows, setRows] = useState([{ id: 1, title: "", status: "", description: "", author: "" }]);

  const [open, setOpen] = React.useState(false);
  const [isEdit, setEdit] = React.useState(false);
  const [disable, setDisable] = React.useState(true);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const handleAdd = () => {
    setRows([
      ...rows,
      {
        id: rows.length + 1,
        title: "",
        status: "",
        description: "",
        author: "",
      },
    ]);
    setEdit(true);
  };

  const handleEdit = (i) => {
    setEdit(!isEdit);
  };

  const handleSave = () => {
    setEdit(!isEdit);
    setRows(rows);
    console.log("saved : ", rows);
    setDisable(true);
    setOpen(true);
  };

  const handleInputChange = (e, index) => {
    setDisable(false);
    const { name, value } = e.target;
    const list = [...rows];
    list[index][name] = value;
    setRows(list);
  };

  const handleConfirm = () => {
    setShowConfirm(true);
  };

  const handleRemoveClick = (i) => {
    const list = [...rows];
    list.splice(i, 1);
    setRows(list);
    setShowConfirm(false);
  };

  const handleNo = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
        style={{ bottom: "104px" }}
      >
        <Alert onClose={handleClose} severity="success">
          Record saved successfully!
        </Alert>
      </Snackbar>
      <Box margin={1}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {isEdit ? (
              <div>
                <Button onClick={handleAdd}>
                  <AddBoxIcon onClick={handleAdd} />
                  ADD
                </Button>
                {rows.length !== 0 && (
                  <div>
                    {disable ? (
                      <Button disabled align="right" onClick={handleSave}>
                        <DoneIcon />
                        SAVE
                      </Button>
                    ) : (
                      <Button align="right" onClick={handleSave}>
                        <DoneIcon />
                        SAVE
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Button onClick={handleAdd}>
                  <AddBoxIcon onClick={handleAdd} />
                  ADD
                </Button>
                <Button align="right" onClick={handleEdit}>
                  <CreateIcon />
                  EDIT
                </Button>
              </div>
            )}
          </div>
        </div>
        <Table>
          <TableRow>
            <TableCell style={{ fontWeight: "bold" }}>Title</TableCell>
            <TableCell style={{ fontWeight: "bold" }}>Status</TableCell>
            <TableCell style={{ fontWeight: "bold" }}>Description</TableCell>
            <TableCell style={{ fontWeight: "bold" }}>Author</TableCell>
            <TableCell style={{ fontWeight: "bold" }}>Actions</TableCell>
          </TableRow>
          <TableBody>
            {rows.map((row, i) => {
              return (
                <>
                  <TableRow>
                    {isEdit ? (
                      <>
                        <TableCell padding="none" width={"20%"}>
                          <MDInput
                            placeholder="Title"
                            value={row.title}
                            size="small"
                            name="title"
                            fullWidth
                            onChange={(e) => handleInputChange(e, i)}
                          />
                        </TableCell>
                        <TableCell padding="none" width={"10%"}>
                          <MDInput
                            placeholder="Status"
                            value={row.status}
                            size="small"
                            name="status"
                            fullWidth
                            onChange={(e) => handleInputChange(e, i)}
                          />
                        </TableCell>
                        <TableCell padding="none">
                          <MDInput
                            placeholder="Description"
                            value={row.description}
                            size="small"
                            name="description"
                            fullWidth
                            onChange={(e) => handleInputChange(e, i)}
                          />
                        </TableCell>
                        <TableCell padding="none">
                          <Select
                            size="medium"
                            variant="outlined"
                            fullWidth
                            id="author"
                            name="author"
                            style={{ height: "50px" }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: {
                                    xs: 100,
                                    sm: 200,
                                  },
                                  width: { xs: 100, sm: 100 },
                                },
                              },
                            }}
                            onChange={(e) => handleInputChange(e, i)}
                          >
                            <MenuItem value=""></MenuItem>
                            <MenuItem value="John Doe">John Doe</MenuItem>
                            <MenuItem value="Arlene T. Munoz">Arlene T. Munoz</MenuItem>
                            <MenuItem value="Karen W. Franklin">Karen W. Franklin</MenuItem>
                            <MenuItem value="Kenneth P. Pierce">Kenneth P. Pierce</MenuItem>
                            <MenuItem value="Jamie E. Hartley">Jamie E. Hartley</MenuItem>
                          </Select>
                          {/* <select
                            style={{ width: "100px" }}
                            name="author"
                            value={row.author}
                            onChange={(e) => handleInputChange(e, i)}
                          >
                            <option value=""></option>
                            <option value="John Doe">John Doe</option>
                            <option value="Arlene T. Munoz">Arlene T. Munoz</option>
                            <option value="Karen W. Franklin">Karen W. Franklin</option>
                            <option value="Kenneth P. Pierce">Kenneth P. Pierce</option>
                            <option value="Jamie E. Hartley">Jamie E. Hartley</option>
                          </select> */}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell width={"10%"} component="th" scope="row">
                          {row.title}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.status}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.description}
                        </TableCell>
                        <TableCell component="th" scope="row">
                          {row.author}
                        </TableCell>
                        <TableCell component="th" scope="row"></TableCell>
                      </>
                    )}
                    {isEdit ? (
                      <Button className="mr10" onClick={() => handleRemoveClick(i)}>
                        <ClearIcon />
                      </Button>
                    ) : (
                      <Button className="mr10" onClick={handleConfirm}>
                        <DeleteOutlineIcon />
                      </Button>
                    )}
                    {showConfirm && (
                      <div>
                        <Dialog
                          open={showConfirm}
                          onClose={handleNo}
                          aria-labelledby="alert-dialog-title"
                          aria-describedby="alert-dialog-description"
                        >
                          <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                          <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                              Are you sure to delete
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={() => handleRemoveClick(i)} color="primary" autoFocus>
                              Yes
                            </Button>
                            <Button onClick={handleNo} color="primary" autoFocus>
                              No
                            </Button>
                          </DialogActions>
                        </Dialog>
                      </div>
                    )}
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}

export default TableDemo;
