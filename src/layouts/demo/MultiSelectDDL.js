import React, { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import InputLabel from "@mui/material/InputLabel";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const MultiSelectDDL = () => {
  //   const options = [
  //     "Oliver Hansen",
  //     "Van Henry",
  //     "April Tucker",
  //     "Ralph Hubbard",
  //     "Omar Alexander",
  //     "Carlos Abbott",
  //     "Miriam Wagner",
  //     "Bradley Wilkerson",
  //     "Virginia Andrews",
  //     "Kelly Snyder",
  //   ];
  const options = [
    {
      text: "",
      value: -1,
    },
    { text: "Oliver Hansen", value: 1 },
    { text: "Van Henry", value: 2 },
    { text: "April Tucker", value: 3 },
    // { text: "Ralph Hubbard", value: 4 },
    // { text: "Omar Alexander", value: 5 },
    // { text: "Omar Alexander", value: 6 },
    // { text: "Carlos Abbott", value: 7 },
    // { text: "Miriam Wagner", value: 8 },
    // { text: "Bradley Wilkerson", value: 9 },
    // { text: "Virginia Andrews", value: 10 },
    // { text: "Kelly Snyder", value: 11 },
  ];
  const [selectedLinkItems, setSelectedLinkItems] = useState([]);
  const isAllSelected = options.length > 0 && selectedLinkItems.length === options.length;

  const handleChange = (event) => {
    const value = event.target.value;
    if (value[value.length - 1] === "all") {
      setSelectedLinkItems(
        selectedLinkItems.length === options.length ? [] : options.map((o) => o.value)
      );
      return;
    }
    // const selectedOption = value.map((v) => options?.find((o) => o.value === v));
    setSelectedLinkItems(value);
    //alert(value);
    console.log(selectedLinkItems);
  };
  return (
    <>
      <InputLabel id="mutiple-select-label">Multiple Select</InputLabel>
      <Select
        labelId="mutiple-select-label"
        multiple
        value={selectedLinkItems}
        onChange={handleChange}
        renderValue={(selected) =>
          selected.map((s) => options.find((o) => o.value === s)?.text).join(", ")
        }
      >
        <MenuItem
          value="all"
          sx={{
            root: isAllSelected ? "" : "", //classes.selectedAll
          }}
        >
          <ListItemIcon>
            <Checkbox
              sx={{ indeterminate: "" }} //classes.indeterminateColor
              checked={isAllSelected}
              indeterminate={
                selectedLinkItems.length > 0 && selectedLinkItems.length < options.length
              }
            />
          </ListItemIcon>
          <ListItemText sx={{ primary: "" }} primary="Select All" />
          {/* //classes.selectAllText */}
        </MenuItem>
        {options.map((option, index) => {
          const isChecked = selectedLinkItems?.find((s) => s === option?.value) !== undefined;
          return (
            <MenuItem
              key={`menuItem_${option.value}`}
              value={option.value}
              style={{ width: "500px" }}
            >
              {/* <ListItemText>
                {index === 0 ? (
                  <tr>
                    <td width={"20ppx"}>Id</td>
                    <td>Title</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td width={"20ppx"}>
                        {" "}
                        <ListItemIcon>
                          <Checkbox checked={isChecked} />
                        </ListItemIcon>
                      </td>
                      <td>{option.text}</td>
                    </tr>
                  </>
                )}
              </ListItemText> */}
              {index === 0 ? (
                <tr>
                  <th width={"200px"}>Id</th>
                  <th width={"200px"}>Title</th>
                  <th>Author</th>
                </tr>
              ) : (
                <>
                  <tr>
                    <td width={"200px"}>
                      <Checkbox checked={isChecked} />
                    </td>
                    <td width={"200px"}>{option.text}</td>
                    <td>John Doe</td>
                  </tr>
                </>
              )}
            </MenuItem>
          );
        })}
      </Select>
    </>
  );
};

export default MultiSelectDDL;
