import React from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";
import ConceptDetails from "./ConceptDetails";
const ConceptInfo = () => {
  const { id } = useParams();
  if (!id) {
    return null;
  }
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ConceptDetails conceptId={id} />
    </DashboardLayout>
  );
};

export default ConceptInfo;
