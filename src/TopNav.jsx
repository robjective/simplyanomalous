import React from "react";
import { Link } from "react-router-dom";
import './TopNav.css';

function TopNav({ supervisors, setSelectedDistrict }) {
  // Sort supervisors by district number
  const sortedSupervisors = [...supervisors].sort(
    (a, b) => Math.floor(a.sup_dist_num) - Math.floor(b.sup_dist_num)
  );

  return (
    <div className="top-nav-container">
      <h2 className="district-list-title">Dashboards by Supervisor District:</h2>
      <div className="district-list">
        <div className="district-item citywide-item">
          <Link
            to="/"
            onClick={() => setSelectedDistrict(null)}
            className="district-link"
          >
            Citywide
          </Link>
        </div>
        {sortedSupervisors.map((supervisor) => (
          <div key={Math.floor(supervisor.sup_dist_num)} className="district-item">
            <Link
              to={`/${supervisor.sup_name.replace(/\s+/g, "-").toLowerCase()}/district/${Math.floor(supervisor.sup_dist_num)}`}
              onClick={() => setSelectedDistrict(supervisor.sup_dist_num)}
              className="district-link"
            >
              District {Math.floor(supervisor.sup_dist_num)}: {supervisor.sup_name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopNav;
