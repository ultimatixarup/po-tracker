import React from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../components/Navbars/DashboardNavbar";
import EmplyeeDetials from "./EmployeeDetails";
const EmployeeInfo = () => {
  const { id } = useParams();
  if (!id) {
    return null;
  }
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <EmplyeeDetials employeeId={id} />;
    </DashboardLayout>
  );
};

export default EmployeeInfo;
