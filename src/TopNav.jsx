import React from "react";
import { Link, useLocation } from "react-router-dom";

function TopNav({ selectedDistrict, setSelectedDistrict }) {
  const location = useLocation();

  const getActiveClass = (path) => (location.pathname === path ? "active-tab" : "");

  return (
    <nav className="top-nav">
      <Link to="/" className={getActiveClass("/")} onClick={() => setSelectedDistrict(null)}>
        Citywide
      </Link>
      {Array.from({ length: 11 }, (_, i) => (
        <Link
          key={i}
          to={`/district/${i + 1}`}
          className={getActiveClass(`/district/${i + 1}`)}
          onClick={() => setSelectedDistrict(i + 1)}
        >
          District {i + 1}
        </Link>
      ))}
    </nav>
  );
}

export default TopNav;
