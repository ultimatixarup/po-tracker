import { Link, useLocation, useParams } from "react-router-dom";
import { useAppStore } from "lib/store/appStore";
import PropTypes from "prop-types";
import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Icon from "@mui/material/Icon";
import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";

function Breadcrumbs({ icon, title, route, light }) {
  const { employeeInfo, conceptInfo } = useAppStore((state) => state);

  const routes = route.slice(0, -1);
  const getNameById = (id) => {
    if (id) {
      const pathname = useLocation().pathname.toLowerCase();
      if (pathname.toLowerCase().includes("/employees/")) {
        return employeeInfo ? employeeInfo.name : null;
      } else if (pathname.toLowerCase().includes("/concepts/")) {
        return conceptInfo ? conceptInfo.title : null;
      }
    }

    return null;
  };
  const { id } = useParams();
  const name = getNameById(id);
  return (
    <MDBox mr={{ xs: 0, xl: 8 }}>
      <MuiBreadcrumbs
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: ({ palette: { white, grey } }) => (light ? white.main : grey[600]),
          },
        }}
      >
        <Link to="/">
          <MDTypography
            component="span"
            variant="body2"
            color={light ? "white" : "dark"}
            opacity={light ? 0.8 : 0.5}
            sx={{ lineHeight: 0 }}
          >
            <Icon>{icon}</Icon>
          </MDTypography>
        </Link>
        {routes.map((el) => (
          <Link to={`/${el}`} key={el}>
            <MDTypography
              component="span"
              variant="button"
              fontWeight="regular"
              textTransform="capitalize"
              color={light ? "white" : "dark"}
              opacity={light ? 0.8 : 0.5}
              sx={{ lineHeight: 0 }}
            >
              {el}
            </MDTypography>
          </Link>
        ))}
        <MDTypography
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          color={light ? "white" : "dark"}
          sx={{ lineHeight: 0 }}
        >
          {name ? name : title.replace("-", " ")}
        </MDTypography>
      </MuiBreadcrumbs>
      {/* <MDTypography
        fontWeight="bold"
        textTransform="capitalize"
        variant="h6"
        color={light ? "white" : "dark"}
        noWrap
      >
        {title.replace("-", " ")}
      </MDTypography> */}
    </MDBox>
  );
}

Breadcrumbs.defaultProps = {
  light: false,
};

Breadcrumbs.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  route: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  light: PropTypes.bool,
};

export default Breadcrumbs;
