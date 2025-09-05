import { useMemo, useEffect, useState } from "react";

import PropTypes from "prop-types";
import { useTable, usePagination, useGlobalFilter, useSortBy } from "react-table";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";

import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";
import MDInput from "components/ui/MDInput";
import MDPagination from "components/ui/MDPagination";
const Pagination = ({ entriesPerPage, showTotalEntries, pagination, totalCount, onPageChange }) => {
  const [pIndex, setPIndex] = useState(0);
  const pIndexMemo = useMemo(() => pIndex, [pIndex]);
  let randomData = [];
  for (let index = 1; index <= totalCount; index++) {
    randomData.push({ index });
  }
  const columns = useMemo(() => [{ Header: "Index", accessor: "index" }], [totalCount]);
  const data = useMemo(() => randomData, [totalCount]);

  const defaultValue = entriesPerPage.defaultValue ? entriesPerPage.defaultValue : 10;
  const entries = entriesPerPage.entries
    ? entriesPerPage.entries.map((el) => el.toString())
    : ["5", "10", "15", "20", "25", "30", "50", "100"];
  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: pIndexMemo } },
    usePagination
  );

  const {
    rows,
    pageOptions,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;

  useEffect(() => setPageSize(defaultValue || 10), [defaultValue]);
  const setEntriesPerPage = (value) => {
    setPageSize(value);
    setPIndex(0);
    onPageChange && onPageChange({ pageIndex: 0, pageSize: value });
  };

  const renderPagination = pageOptions.map((option) => (
    <MDPagination
      item
      key={option}
      onClick={() => {
        setPIndex(Number(option));
        handleGotoPage(Number(option));
      }}
      active={pIndexMemo === option}
    >
      {option + 1}
    </MDPagination>
  ));
  const handleGotoPage = (pageNumber) => {
    gotoPage(pageNumber);
    onPageChange && onPageChange({ pageIndex: pageNumber, pageSize });
  };
  const handlePreviousPage = () => {
    previousPage();
    onPageChange && onPageChange({ pageIndex: pageIndex - 1, pageSize });
  };
  const handleNextPage = () => {
    nextPage();
    onPageChange && onPageChange({ pageIndex: pageIndex + 1, pageSize });
  };
  const handleInputPagination = ({ target: { value } }) =>
    value > pageOptions.length || value < 0 ? handleGotoPage(0) : handleGotoPage(Number(value));
  const customizedPageOptions = pageOptions.map((option) => option + 1);
  const handleInputPaginationValue = ({ target: value }) => handleGotoPage(Number(value.value - 1));
  const entriesStart = pageIndex === 0 ? pageIndex + 1 : pageIndex * pageSize + 1;
  let entriesEnd;
  if (pageIndex === 0) {
    entriesEnd = pageSize;
  } else if (pageIndex === pageOptions.length - 1) {
    entriesEnd = rows.length;
  } else {
    entriesEnd = pageSize * (pageIndex + 1);
  }

  return (
    <MDBox sx={{ boxShadow: "none" }}>
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

        {pageOptions.length > 1 ? (
          <MDPagination
            variant={pagination.variant ? pagination.variant : "gradient"}
            color={pagination.color ? pagination.color : "info"}
          >
            {canPreviousPage && (
              <MDPagination item onClick={() => handlePreviousPage()}>
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
              <MDPagination item onClick={() => handleNextPage()}>
                <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
              </MDPagination>
            )}
          </MDPagination>
        ) : (
          <MDBox />
        )}
        {entriesPerPage ? (
          <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
            {entriesPerPage && (
              <MDBox display="flex" alignItems="center">
                <MDTypography variant="caption" color="secondary">
                  Rows per page &nbsp;&nbsp;
                </MDTypography>
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
              </MDBox>
            )}
          </MDBox>
        ) : null}
      </MDBox>
    </MDBox>
  );
};

Pagination.defaultProps = {
  entriesPerPage: { defaultValue: 10, entries: [5, 10, 15, 20, 25, 30, 50, 100] },
  showTotalEntries: true,
  pagination: { variant: "gradient", color: "info" },
};

Pagination.propTypes = {
  entriesPerPage: PropTypes.oneOfType([
    PropTypes.shape({
      defaultValue: PropTypes.number,
      entries: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.bool,
  ]),
  showTotalEntries: PropTypes.bool,
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
  totalCount: PropTypes.number,
  onPageChange: PropTypes.func,
};

export default Pagination;
