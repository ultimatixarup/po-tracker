import { useContext, useState } from "react";

import { Link } from "react-router-dom";

import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";

import axios from "axios";
import MDBox from "components/ui/MDBox";
import MDButton from "components/ui/MDButton";
import MDInput from "components/ui/MDInput";
import MDTypography from "components/ui/MDTypography";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../../index";
import { useAppStore } from "lib/store/appStore";

import bgImage from "assets/images/login-bg.jpg";

function Basic() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSetRememberMe = () => setRememberMe(!rememberMe);
  const { loginAction } = useAppStore((state) => state);

  const onLoginAction = async () => {
    if (email.trim() === "" && password.trim() === "") {
      setError("Please enter the credentials.");
      return;
    }
    setError("");

    const loginInfo = await loginAction({ email, password });
    if (loginInfo?.errorMessage) {
      setError(loginInfo?.errorMessage);
    } else {
      setUser({ accessToken: loginInfo?.accessToken });
      navigate("/dashboard");
    }
  };
  return (
    <BasicLayout image={bgImage}>
      <Card>
        <MDBox
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
          mx={2}
          mt={-3}
          p={2}
          mb={1}
          textAlign="center"
        >
          <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
            Sign in
          </MDTypography>
        </MDBox>
        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form">
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                value={email}
                fullWidth
                onChange={(e) => setEmail(e.target.value)}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </MDBox>
            <MDBox>
              <MDTypography variant="body2" color="error" textAlign="center">
                {error}
              </MDTypography>
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>

            <MDBox mt={4} mb={1}>
              <MDButton variant="gradient" color="info" fullWidth onClick={onLoginAction}>
                sign in
              </MDButton>
            </MDBox>
            <MDBox mt={3} mb={1} textAlign="center">
              <MDTypography variant="button" color="text">
                Don&apos;t have an account?{" "}
                <MDTypography
                  component={Link}
                  to="/authentication/sign-up"
                  variant="button"
                  color="info"
                  fontWeight="medium"
                  textGradient
                >
                  Sign up
                </MDTypography>
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Basic;
