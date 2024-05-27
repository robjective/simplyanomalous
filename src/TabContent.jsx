import React, { useState, useEffect } from "react";
import ErrorBarCharts from "./ErrorBarCharts";
import AnomalyDisplay from "./AnomalyDisplay";
import MapComponent from "./MapComponent";
import { fetchDataFromAPI } from "./utils/api";
import { processData } from "./utils/dataProcessing";

function TabContent({ district }) {
  const [allData, setAllData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [activeTab, setActiveTab] = useState("anomalies"); // Set default tab to "anomalies"
  const [incidentData, setIncidentData] = useState([]); // State to hold incidents data

  useEffect(() => {
    fetchDistrictData(district);
  }, [district]);

  useEffect(() => {
    setActiveTab("anomalies");
  }, [district]);

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
        GROUP BY incident_category, year, week 
        ORDER BY year, week`;

    const fetchedData = await fetchDataFromAPI(endpoint, query);
    const { groupedData, metadata } = processData(fetchedData);
    setAllData(groupedData || []);
    setMetadata(metadata || {});
    setIsLoading(false);
  };

  const handleAnomalyClick = async (anomaly) => {
    const today = new Date().toISOString().split("T")[0] + "T23:59:59";
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const fromDate = oneMonthAgo.toISOString().split("T")[0] + "T00:00:00";

    const endpoint = "wg3w-h783.json";
    const whereClause = `report_datetime >= '${fromDate}' AND report_datetime <= '${today}' AND incident_category = '${anomaly.category}'`;
    const query = `
      SELECT Intersection, COUNT(*) as count
      WHERE ${whereClause}
      GROUP BY Intersection
      ORDER BY count DESC`;

    const fetchedIncidentData = await fetchDataFromAPI(endpoint, query);
    setIncidentData(fetchedIncidentData || []);
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district); // Set the selected district
  };

  return (
    <div>
      <h2>{district ? `District ${district}` : "Citywide"}</h2>
      <MapComponent intersectionData={incidentData} onDistrictClick={handleDistrictClick} />{" "}
      {/* Pass incidentData to MapComponent */}
      <nav className="sub-nav">
        <button
          className={activeTab === "anomalies" ? "active-tab" : ""}
          onClick={() => setActiveTab("anomalies")}
        >
          Anomalies
        </button>
        <button
          className={activeTab === "charts" ? "active-tab" : ""}
          onClick={() => setActiveTab("charts")}
        >
          Charts
        </button>
      </nav>
      <div className="tab-content">
        {activeTab === "charts" &&
          (isLoading ? (
            <div>Loading...</div>
          ) : (
            <ErrorBarCharts data={allData} />
          ))}
        {activeTab === "anomalies" && (
          <AnomalyDisplay
            data={allData}
            metadata={metadata}
            district={district}
            onAnomalyClick={handleAnomalyClick}
          />
        )}
      </div>
    </div>
  );
}

export default TabContent;
