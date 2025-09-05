import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";
import ModuleDetails from "./ModuleDetails";

const ModuleInfo = () => {
  const { id } = useParams();
  if (!id) {
    return null;
  }
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ModuleDetails ModuleId={id} />;
    </DashboardLayout>
  );
};

export default ModuleInfo;
