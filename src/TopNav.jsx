import React from "react";
import { Link } from "react-router-dom";
import { List, ListItemButton, ListItemText } from "@mui/material";

function TopNav({ supervisors, setSelectedDistrict }) {
  return (
    <List>
      <ListItemButton
        component={Link}
        to="/"
        onClick={() => setSelectedDistrict(null)}
      >
        <ListItemText primary="Citywide" />
      </ListItemButton>
      {supervisors.map((supervisor) => (
        <ListItemButton
          key={Math.round(supervisor.sup_dist_num)}
          component={Link}
          to={`/${supervisor.sup_name.replace(/\s+/g, "-").toLowerCase()}/district/${supervisor.sup_dist_num}`}
          onClick={() => setSelectedDistrict(supervisor.sup_dist_num)}
        >
          <ListItemText primary={`${supervisor.sup_name} (District ${Math.round(supervisor.sup_dist_num)})`} />
        </ListItemButton>
      ))}
    </List>
  );
}

export default TopNav;
