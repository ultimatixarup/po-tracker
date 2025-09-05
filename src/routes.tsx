import Icon from "@mui/material/Icon";
import DashboardLayout from "./components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "./components/Navbars/DashboardNavbar";
import Dashboard from "./layouts/dashboard";
import SubsytemsComponent from "./layouts/susbsystems/index";

export const TodoComponent = ({ children }: any) => {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      {children}
    </DashboardLayout>
  );
};

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    visible: true,
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Projects",
    key: "concepts",
    visible: true,
    icon: <Icon fontSize="small">table_view</Icon>,
    route: "/subsystems",
    component: <SubsytemsComponent />,
  },
];

export default routes;
