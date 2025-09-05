import { useState } from "react";
import PropTypes from "prop-types";
import { Tabs, Tab, Box } from "@mui/material";

const a11yProps = (index) => {
  return {
    id: `concept-tab-${index}`,
    "aria-controls": `concept-tabpanel-${index}`,
  };
};
const CustomTabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`concept-tabpanel-${index}`}
      aria-labelledby={`concept-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const MuiTabs = ({ tabs, onTabIndexChange }) => {
  const [value, setValue] = useState(0);
  if (!tabs) return null;
  const handleTabChange = async (event, newValue) => {
    setValue(newValue);
    onTabIndexChange(event, newValue);
  };
  return (
    <>
      <Tabs
        value={value}
        onChange={(e, newValue) => handleTabChange(e, newValue)}
        aria-label="concpets-details"
        fullWidth
      >
        {tabs.map((tab, index) => {
          const { label } = tab;
          return <Tab label={label} name={tab.name} {...a11yProps(index)} />;
        })}
      </Tabs>
      {tabs.map((tab, index) => {
        const { children } = tab;
        return (
          <CustomTabPanel value={value} index={index}>
            {children}
          </CustomTabPanel>
        );
      })}
    </>
  );
};
MuiTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      label: PropTypes.string,
      children: PropTypes.node,
    })
  ),
  onTabIndexChange: PropTypes.func,
};
export default MuiTabs;
