import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import Auth0ProviderWithHistory from "./auth0provider";
import { MaterialUIControllerProvider } from "./context";
import reportWebVitals from "./reportWebVitals";

export const UserContext = React.createContext({ user: null }) as any;
export const LoaderContext = React.createContext({ isLoading: false }) as any;

const container = document.getElementById("app") as any;

const Root = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const handleClose = () => {
    setIsLoading(false);
  };

  return (
    <BrowserRouter>
      <Auth0ProviderWithHistory>
        <MaterialUIControllerProvider>
          <UserContext.Provider value={{ user, setUser }}>
            <LoaderContext.Provider value={{ isLoading, setIsLoading }}>
              <App />
              <Backdrop
                sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isLoading}
                onClick={handleClose}
              >
                <CircularProgress color="inherit" />
              </Backdrop>
            </LoaderContext.Provider>
          </UserContext.Provider>
        </MaterialUIControllerProvider>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  );
};

ReactDOM.render(<Root />, document.getElementById("app"));
reportWebVitals();
