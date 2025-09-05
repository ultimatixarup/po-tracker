import { useEffect } from "react";

import { NavLink, useLocation } from "react-router-dom";

import PropTypes from "prop-types";

import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Link from "@mui/material/Link";
import List from "@mui/material/List";

import MDBox from "components/ui/MDBox";
import MDTypography from "components/ui/MDTypography";

import SidenavCollapse from "./SidenavCollapse";

import { SvgIcon } from "@mui/material";
import SidenavRoot from "./SidenavRoot";
import sidenavLogoLabel from "./styles/sidenav";

import {
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
  useMaterialUIController,
} from "context";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode, sidenavColor } = controller;
  const location = useLocation();
  const collapseName = location.pathname.replace("/", "");

  let textColor = "white";

  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
      setTransparentSidenav(dispatch, window.innerWidth < 1200 ? false : transparentSidenav);
      setWhiteSidenav(dispatch, window.innerWidth < 1200 ? false : whiteSidenav);
    }

    window.addEventListener("resize", handleMiniSidenav);

    handleMiniSidenav();

    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, location]);

  const renderRoutes = routes.map(
    ({ type, name, icon, title, noCollapse, key, href, route, visible }) => {
      let returnValue;
      if (!visible) return null;
      if (type === "collapse") {
        returnValue = href ? (
          <Link
            href={href}
            key={key}
            target="_blank"
            rel="noreferrer"
            sx={{ textDecoration: "none" }}
          >
            <SidenavCollapse
              name={name}
              icon={icon}
              active={key === collapseName}
              noCollapse={noCollapse}
            />
          </Link>
        ) : (
          <NavLink key={key} to={route}>
            <SidenavCollapse name={name} icon={icon} active={key === collapseName} />
          </NavLink>
        );
      } else if (type === "title") {
        returnValue = (
          <MDTypography
            key={key}
            color={textColor}
            display="block"
            variant="caption"
            fontWeight="bold"
            textTransform="uppercase"
            pl={3}
            mt={2}
            mb={1}
            ml={1}
          >
            {title}
          </MDTypography>
        );
      } else if (type === "divider") {
        returnValue = (
          <Divider
            key={key}
            light={
              (!darkMode && !whiteSidenav && !transparentSidenav) ||
              (darkMode && !transparentSidenav && whiteSidenav)
            }
          />
        );
      }

      return returnValue;
    }
  );

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox pt={3} pb={1} px={4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>
        <MDBox component={NavLink} to="/" display="flex" alignItems="center">
          <SvgIcon style={{ width: 80, height: 50 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 30">
              <path
                fill={darkMode ? "white" : textColor}
                d="M72.831 29.063l3.781-17.72 1.44 17.72h8.159L82.429.938h-8.725L69.63 17.811 65.56.937h-8.726l-3.781 28.125h8.144l1.454-17.718 3.781 17.718zM90 .938v28.125h18v-5.907H97.594V.938zM8.768.938L0 29.063h8.768L9.938 24h7.598l1.17 5.063h8.768L18.706.938H8.768zm4.969 6.187l2.63 11.531h-5.26l2.63-11.531zM47.789 8.883c-7.273-6.202-18.623-3.68-18.735 1.998C27.404.346 40.472-1.854 47.788 1.463c.13 1.692.261 3.513.001 7.42zm-6.035 3.36c2.997 1.14 8.377 2.583 8.377 8.625 0 3.714-3.675 7.194-7.928 8.469-5.262 1.578-10.511.018-13.734-1.335v-6.848c2.723 1.889 5.111 2.9 8.081 2.96 1.788.038 4.506-.834 4.506-3.246 0-2.065-1.96-2.703-3.088-3.304C31.493 14.114 33.445 7.171 39.3 6.6c-1.7.55-2.05 1.45-2.048 2.28.004 2.032 2.67 2.666 4.502 3.363z"
              />
            </svg>
          </SvgIcon>
          {/* {brand && <MDBox component="img" src={brand} alt="Brand" width="2rem" />} */}
          <MDBox
            width={!brandName && "100%"}
            sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
          >
            <MDTypography component="h6" variant="button" fontWeight="medium" color={textColor}>
              {brandName}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
      <Divider
        light={
          (!darkMode && !whiteSidenav && !transparentSidenav) ||
          (darkMode && !transparentSidenav && whiteSidenav)
        }
      />
      <List>{renderRoutes}</List>
    </SidenavRoot>
  );
}

Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
