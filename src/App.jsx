import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";
import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./style.css";

import MDBox from "./components/ui/MDBox";

import Configurator from "./components/Configurator";
import Sidenav from "./components/Sidenav";

import theme from "./assets/theme";
import themeRTL from "./assets/theme/theme-rtl";

import themeDark from "./assets/theme-dark";
import themeDarkRTL from "./assets/theme-dark/theme-rtl";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";

import routes from "./routes";

import SvgIcon from "@mui/material/SvgIcon";
import brandDark from "./assets/images/logo-dark.png";
import brandWhite from "./assets/images/logo.png";
import { setMiniSidenav, setOpenConfigurator, useMaterialUIController } from "./context";
const BrandIcon = () => (
  <SvgIcon>
    <svg xmlns="http://www.w3.org/2000/svg">
      <symbol id="logo" viewBox="0 0 108 30">
        <g>
          <path d="M72.831 29.063l3.781-17.72 1.44 17.72h8.159L82.429.938h-8.725L69.63 17.811 65.56.937h-8.726l-3.781 28.125h8.144l1.454-17.718 3.781 17.718zM90 .938v28.125h18v-5.907H97.594V.938zM8.768.938L0 29.063h8.768L9.938 24h7.598l1.17 5.063h8.768L18.706.938H8.768zm4.969 6.187l2.63 11.531h-5.26l2.63-11.531zM47.789 8.883c-7.273-6.202-18.623-3.68-18.735 1.998C27.404.346 40.472-1.854 47.788 1.463c.13 1.692.261 3.513.001 7.42zm-6.035 3.36c2.997 1.14 8.377 2.583 8.377 8.625 0 3.714-3.675 7.194-7.928 8.469-5.262 1.578-10.511.018-13.734-1.335v-6.848c2.723 1.889 5.111 2.9 8.081 2.96 1.788.038 4.506-.834 4.506-3.246 0-2.065-1.96-2.703-3.088-3.304C31.493 14.114 33.445 7.171 39.3 6.6c-1.7.55-2.05 1.45-2.048 2.28.004 2.032 2.67 2.666 4.502 3.363z" />
        </g>
      </symbol>
    </svg>
  </SvgIcon>
);
export default function App() {
  const [controller, dispatch] = useMaterialUIController();
  const {
    miniSidenav,
    direction,
    layout,
    openConfigurator,
    sidenavColor,
    transparentSidenav,
    whiteSidenav,
    darkMode,
  } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    if (document?.scrollingElement) document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  const configsButton = (
    <MDBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.25rem"
      height="3.25rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="small" color="inherit">
        settings
      </Icon>
    </MDBox>
  );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={darkMode ? themeDarkRTL : themeRTL}>
        <CssBaseline />
        {layout === "dashboard" && (
          <>
            {/* brandDark : brandWhite */}
            <Sidenav
              color={sidenavColor}
              brand={
                (transparentSidenav && !darkMode) || whiteSidenav ? <BrandIcon /> : <BrandIcon />
              }
              brandName="Project Tracker"
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={darkMode ? themeDark : theme}>
      <CssBaseline />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={(transparentSidenav && !darkMode) || whiteSidenav ? brandDark : brandWhite}
            brandName="Project Tracker"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {configsButton}
        </>
      )}
      {layout === "vr" && <Configurator />}
      <Routes>
        {getRoutes(routes)}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}
