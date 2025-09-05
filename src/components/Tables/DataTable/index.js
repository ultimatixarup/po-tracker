import { useMemo, useEffect, useState } from "react";

import PropTypes from "prop-types";
import { useTable, usePagination, useGlobalFilter, useAsyncDebounce, useSortBy } from "react-table";
import Table from "@mui/material/Table";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import MDButton from "components/ui/MDButton";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";

import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";
import MDInput from "components/ui/MDInput";
import MDPagination from "components/ui/MDPagination";
import boxShadows from "assets/theme/base/boxShadows";
import DataTableHeadCell from "components/Tables/DataTable/DataTableHeadCell";
import DataTableBodyCell from "components/Tables/DataTable/DataTableBodyCell";
import AddConceptDialog from "../forms/AddConceptDialog";
const { sliderBoxShadow } = boxShadows;
import { useAppStore } from "lib/store/appStore";
import { Link } from "react-router-dom";
import ConceptDetails from "../../../layouts/concepts/ConceptDetails";

function DataTable({
  entriesPerPage,
  canSearch,
  showTotalEntries,
  table,
  pagination,
  isSorted,
  noEndBorder,
  toggleConceptId,
}) {
  const { conceptSearchQuery, setConceptSearchQuery, getConceptsAction } = useAppStore(
    (state) => state
  );
  const [openSnackbar, setSnckbarValue] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openAddConceptDialog, setOpenAddConceptDialog] = useState(false);
  const [openLinkItemDialog, setOpenLinkItemDialog] = useState({});
  const [addConceptDialogMode, setAddConceptDialogMode] = useState(false);

  const [pIndex, setPIndex] = useState(0);
  const pIndexMemo = useMemo(() => pIndex, [pIndex]);
  const defaultValue = entriesPerPage.defaultValue ? entriesPerPage.defaultValue : 10;
  const entries = entriesPerPage.entries
    ? entriesPerPage.entries.map((el) => el.toString())
    : ["5", "10", "15", "20", "25"];
  const columns = useMemo(() => table.columns, [table]);
  const data = useMemo(() => table.rows, [table]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: pIndexMemo } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    pageOptions,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = tableInstance;

  useEffect(() => setPageSize(defaultValue || 10), [defaultValue]);
  const setEntriesPerPage = (value) => setPageSize(value);

  const renderPagination = pageOptions.map((option) => (
    <MDPagination
      item
      key={option}
      onClick={() => {
        setPIndex(Number(option));
        gotoPage(Number(option));
      }}
      active={pageIndex === option}
    >
      {option + 1}
    </MDPagination>
  ));

  const handleInputPagination = ({ target: { value } }) =>
    value > pageOptions.length || value < 0 ? gotoPage(0) : gotoPage(Number(value));

  const customizedPageOptions = pageOptions.map((option) => option + 1);

  const handleInputPaginationValue = ({ target: value }) => gotoPage(Number(value.value - 1));

  const [search, setSearch] = useState(globalFilter);

  const onSearchChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 100);

  const setSortedValue = (column) => {
    let sortedValue;

    if (isSorted && column.isSorted) {
      sortedValue = column.isSortedDesc ? "desc" : "asce";
    } else if (isSorted) {
      sortedValue = "none";
    } else {
      sortedValue = false;
    }

    return sortedValue;
  };

  const entriesStart = pageIndex === 0 ? pageIndex + 1 : pageIndex * pageSize + 1;

  let entriesEnd;

  if (pageIndex === 0) {
    entriesEnd = pageSize;
  } else if (pageIndex === pageOptions.length - 1) {
    entriesEnd = rows.length;
  } else {
    entriesEnd = pageSize * (pageIndex + 1);
  }
  const onAddConceptDialogClose = () => {
    setOpenAddConceptDialog(false);
  };
  const onClearConceptSearch = () => {
    setConceptSearchQuery({ title: "", description: "", status: "" });
    getConceptsAction();
  };
  const onConceptSearch = () => {
    getConceptsAction();
  };
  return (
    <TableContainer sx={{ boxShadow: "none" }}>
      <AddConceptDialog
        open={openAddConceptDialog}
        onClose={onAddConceptDialogClose}
        mode={addConceptDialogMode}
      ></AddConceptDialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={() => setSnckbarValue(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
      {entriesPerPage || canSearch ? (
        <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
          {entriesPerPage && (
            <MDBox display="flex" alignItems="center">
              <Autocomplete
                disableClearable
                value={pageSize.toString()}
                options={entries}
                onChange={(event, newValue) => {
                  setEntriesPerPage(parseInt(newValue, 10));
                }}
                size="small"
                sx={{ width: "5rem" }}
                renderInput={(params) => <MDInput {...params} />}
              />
              <MDTypography variant="caption" color="secondary">
                &nbsp;&nbsp;entries per page
              </MDTypography>
            </MDBox>
          )}
          {canSearch && (
            <MDBox width="12rem" ml="auto">
              <MDInput
                placeholder="Search..."
                value={search}
                size="small"
                fullWidth
                onChange={({ currentTarget }) => {
                  setSearch(search);
                  onSearchChange(currentTarget.value);
                }}
              />
            </MDBox>
          )}
        </MDBox>
      ) : null}
      <Table {...getTableProps()}>
        <MDBox component="thead">
          {headerGroups.map((headerGroup, key) => (
            <TableRow key={key} {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, idx) => (
                <DataTableHeadCell
                  key={idx}
                  {...column.getHeaderProps(isSorted && column.getSortByToggleProps())}
                  width={column.width ? column.width : "auto"}
                  align={column.align ? column.align : "left"}
                  sorted={setSortedValue(column)}
                >
                  {column.render("Header") == "action" ? "" : column.render("Header")}
                  {column.render("Header") == "Concept Title" && (
                    <TextField
                      value={conceptSearchQuery?.title}
                      padding={1}
                      fullWidth
                      inputProps={{
                        style: {
                          height: "0.4375em",
                        },
                      }}
                      margin="dense"
                      id="conceptTitle"
                      name="conceptTitle"
                      variant="outlined"
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") {
                          onConceptSearch();
                          ev.preventDefault();
                        }
                      }}
                      onChange={(e) =>
                        setConceptSearchQuery({ ...conceptSearchQuery, title: e.target.value })
                      }
                    />
                  )}
                  {column.render("Header") == "Status" && (
                    <TextField
                      value={conceptSearchQuery?.status}
                      fullWidth
                      inputProps={{
                        style: {
                          height: "0.4375em",
                        },
                      }}
                      margin="dense"
                      id="conceptStatus"
                      name="conceptStatus"
                      variant="outlined"
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") {
                          onConceptSearch();
                          ev.preventDefault();
                        }
                      }}
                      onChange={(e) =>
                        setConceptSearchQuery({ ...conceptSearchQuery, status: e.target.value })
                      }
                    />
                  )}
                  {column.render("Header") == "Description" && (
                    <Box display={"flex"} alignSelf={"center"} alignItems={"center"}>
                      <TextField
                        value={conceptSearchQuery?.description}
                        inputProps={{
                          style: {
                            height: "0.4375em",
                          },
                        }}
                        fullWidth
                        margin="dense"
                        id="conceptDescription"
                        name="conceptDescription"
                        variant="outlined"
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            onConceptSearch();
                            ev.preventDefault();
                          }
                        }}
                        onChange={(e) =>
                          setConceptSearchQuery({
                            ...conceptSearchQuery,
                            description: e.target.value,
                          })
                        }
                      />
                    </Box>
                  )}
                  {column.render("Header") == "action" && (
                    <>
                      <MDTypography
                        sx={({
                          palette: { light },
                          typography: { size },
                          borders: { borderWidth },
                        }) => ({
                          fontSize: size.sm, //size.sm
                        })}
                        component="a"
                        href="javascript:void(0)"
                        variant="caption"
                        color="text"
                        fontWeight="medium"
                        //onClick={() => setOpenAddConceptDialog(true)}
                      >
                        <Box>
                          <Tooltip title="Add Concept">
                            <Link to={"/concepts/add"}>
                              <Icon fontSize="small" color="success">
                                add_circle
                              </Icon>
                            </Link>
                          </Tooltip>
                        </Box>
                      </MDTypography>
                      <Box display={"flex"} alignItems={"center"}>
                        <MDButton color="dark" style={{ height: 30 }} onClick={onConceptSearch}>
                          Search
                        </MDButton>
                        <MDTypography
                          paddingLeft={1}
                          sx={({
                            palette: { light },
                            typography: { size },
                            borders: { borderWidth },
                          }) => ({
                            fontSize: size.sm,
                          })}
                          component="a"
                          href="javascript:void(0)"
                          variant="caption"
                          color="text"
                          fontWeight="medium"
                          onClick={onClearConceptSearch}
                        >
                          <Tooltip title="Clear Search">
                            <Icon fontSize="small" color="error">
                              clear
                            </Icon>
                          </Tooltip>
                        </MDTypography>
                      </Box>
                    </>
                  )}
                </DataTableHeadCell>
              ))}
            </TableRow>
          ))}
        </MDBox>
        <TableBody {...getTableBodyProps()}>
          {page.map((row, key) => {
            const rowData = row.original.rowData;
            prepareRow(row);
            return (
              <>
                <TableRow key={key} {...row.getRowProps()}>
                  {row.cells.map((cell, idx) => (
                    <DataTableBodyCell
                      style={{ textDecoration: "underline" }}
                      key={idx}
                      noBorder={noEndBorder && rows.length - 1 === key}
                      align={cell.column.align ? cell.column.align : "left"}
                      {...cell.getCellProps()}
                    >
                      {idx === 0 ? (
                        <Link to={"/concepts/" + rowData?.id} className="link">
                          {cell.render("Cell")}
                        </Link>
                      ) : (
                        cell.render("Cell")
                      )}
                    </DataTableBodyCell>
                  ))}
                </TableRow>
                {toggleConceptId && toggleConceptId == rowData?.id && (
                  <TableRow key={key}>
                    <DataTableBodyCell colSpan={7} width="100%">
                      <Box style={{ padding: 10, boxShadow: sliderBoxShadow.thumb }}>
                        <ConceptDetails conceptId={toggleConceptId} />
                      </Box>
                    </DataTableBodyCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>

      <MDBox
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        p={!showTotalEntries && pageOptions.length === 1 ? 0 : 3}
      >
        {showTotalEntries && (
          <MDBox mb={{ xs: 3, sm: 0 }}>
            <MDTypography variant="button" color="secondary" fontWeight="regular">
              Showing {entriesStart} to {entriesEnd} of {rows.length} entries
            </MDTypography>
          </MDBox>
        )}
        {pageOptions.length > 1 && (
          <MDPagination
            variant={pagination.variant ? pagination.variant : "gradient"}
            color={pagination.color ? pagination.color : "info"}
          >
            {canPreviousPage && (
              <MDPagination item onClick={() => previousPage()}>
                <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
              </MDPagination>
            )}
            {renderPagination.length > 100 ? (
              <MDBox width="5rem" mx={1}>
                <MDInput
                  inputProps={{ type: "number", min: 1, max: customizedPageOptions.length }}
                  value={customizedPageOptions[pageIndex]}
                  onChange={(handleInputPagination, handleInputPaginationValue)}
                />
              </MDBox>
            ) : (
              renderPagination
            )}
            {canNextPage && (
              <MDPagination item onClick={() => nextPage()}>
                <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
              </MDPagination>
            )}
          </MDPagination>
        )}
      </MDBox>
    </TableContainer>
  );
}

DataTable.defaultProps = {
  entriesPerPage: { defaultValue: 10, entries: [5, 10, 15, 20, 25] },
  canSearch: false,
  showTotalEntries: true,
  pagination: { variant: "gradient", color: "info" },
  isSorted: true,
  noEndBorder: false,
};

DataTable.propTypes = {
  entriesPerPage: PropTypes.oneOfType([
    PropTypes.shape({
      defaultValue: PropTypes.number,
      entries: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.bool,
  ]),
  canSearch: PropTypes.bool,
  showTotalEntries: PropTypes.bool,
  table: PropTypes.objectOf(PropTypes.array).isRequired,
  pagination: PropTypes.shape({
    variant: PropTypes.oneOf(["contained", "gradient"]),
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "light",
    ]),
  }),
  isSorted: PropTypes.bool,
  noEndBorder: PropTypes.bool,
};

export default DataTable;
