import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";

import { processData } from "./utils/dataProcessing"; // Import the processData function
import ErrorBarCharts from "./ErrorBarCharts";
import MapComponent from "./mapComponent.jsx";
import AnomalyDisplay from "./AnomalyDisplay";
import { fetchDataFromAPI } from "./utils/api";

import "./App.css";

function App() {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    fetchDistrictData(selectedDistrict);
  }, [selectedDistrict]);

  const fetchDistrictData = async (district) => {
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0] + "T23:59:59";
    const endpoint = "wg3w-h783.json";
    let whereClause = `WHERE report_datetime >= '2018-01-01T00:00:00' AND report_datetime <= '${today}'`;
    if (district) {
      whereClause += ` AND supervisor_district = '${district}'`;
    }
    const query = `
      SELECT incident_category, date_extract_y(report_datetime) AS year, date_extract_woy(report_datetime) AS week, COUNT(*) AS count 
      ${whereClause}
      GROUP BY incident_category, year, week ORDER BY year, week`;

    const fetchedData = await fetchDataFromAPI(endpoint, query);
    const { groupedData, metadata } = processData(fetchedData); // Process the data and extract metadata
    console.log("Fetched Data:", fetchedData);
    console.log("Grouped Data:", groupedData);
    console.log("Metadata:", metadata);
    setAllData(groupedData || []);
    setMetadata(metadata || {});
    setIsLoading(false);
  };

  return (
    <Router>
      <div className="App" style={{ padding: "20px" }}>
        <header>
          <header>
            <div className="header-container">
              {" "}
              {/* Added container for positioning */}
              <h1>Transparent San Francisco</h1>
              <span className="badge">Beta</span>
            </div>
          </header>
        </header>
        <TopNav
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
        />
        <MapComponent /> {/* Only show the map of SF */}
        <Routes>
          <Route
            path="/"
            element={
              <TabContent
                data={allData}
                isLoading={isLoading}
                district={null}
                metadata={metadata}
              />
            }
          />
          {Array.from({ length: 11 }, (_, i) => (
            <Route
              key={i}
              path={`/district/${i + 1}`}
              element={
                <TabContent
                  data={allData}
                  isLoading={isLoading}
                  district={i + 1}
                  metadata={metadata}
                />
              }
            />
          ))}
        </Routes>
      </div>
    </Router>
  );
}

function TopNav({ selectedDistrict, setSelectedDistrict }) {
  const location = useLocation();

  const getActiveClass = (path) =>
    location.pathname === path ? "active-tab" : "";

  return (
    <nav className="top-nav">
      <Link
        to="/"
        className={getActiveClass("/")}
        onClick={() => setSelectedDistrict(null)}
      >
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

function TabContent({ data, isLoading, district, metadata }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("charts"); // Default to "charts" tab

  useEffect(() => {
    // Reset to "charts" tab when district changes (optional)
    setActiveTab("anomalies");
  }, [district]); // Add district to dependency array

  useEffect(() => {
    console.log("TabContent Data:", data);
    console.log("TabContent Metadata:", metadata);
  }, [data, metadata]);

  return (
    <div>
      <h2>{district ? `District ${district}` : "Citywide"}</h2>

      <nav className="sub-nav">
        <Link
          to={location.pathname}
          className={activeTab === "anomalies" ? "active-tab" : ""}
          onClick={() => setActiveTab("anomalies")}
        >
          Anomalies
        </Link>
        <Link
          to={location.pathname}
          className={activeTab === "charts" ? "active-tab" : ""}
          onClick={() => setActiveTab("charts")}
        >
          Charts
        </Link>
      </nav>

      <div className="tab-content">
        {activeTab === "charts" && (
          <>
            {isLoading ? <div>Loading...</div> : <ErrorBarCharts data={data} />}
          </>
        )}
        {activeTab === "anomalies" && (
          <div>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <AnomalyDisplay
                data={data}
                metadata={metadata}
                district={district}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
