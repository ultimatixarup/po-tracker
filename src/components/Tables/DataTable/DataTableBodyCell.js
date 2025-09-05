import PropTypes from "prop-types";

import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";
function DataTableBodyCell({ noBorder, align, children, colSpan, width }) {
  return (
    <MDBox
      component="td"
      colSpan={colSpan}
      textAlign={align}
      py={1.5}
      px={3}
      sx={({ palette: { light }, typography: { size }, borders: { borderWidth } }) => ({
        fontSize: size.sm, //size.sm,
        borderBottom: noBorder ? "none" : `${borderWidth[1]} solid ${light.main}`,
      })}
    >
      <MDBox
        display="inline-block"
        width={width ? width : "max-content"}
        sx={{ verticalAlign: "middle" }}
      >
        <MDTypography
          variant="caption"
          sx={({ typography: { size } }) => ({
            fontSize: size.sm, //size.sm
            fontWeight: "medium",
          })}
        >
          {children}
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}

DataTableBodyCell.defaultProps = {
  noBorder: false,
  align: "left",
};

DataTableBodyCell.propTypes = {
  children: PropTypes.node.isRequired,
  noBorder: PropTypes.bool,
  align: PropTypes.oneOf(["left", "right", "center"]),
};

export default DataTableBodyCell;
