import React, { useState, useEffect } from "react";
import ErrorBarCharts from "./ErrorBarCharts";
import AnomalyDisplay from "./AnomalyDisplay";
import CrimeDash from "./CrimeDash";
import { fetchDataFromAPI } from "./utils/api";
import { getSupervisorQuery, getIncidentQuery, getAnomalyQuery } from "./utils/queries";
import { processData } from "./utils/dataProcessing";
import { processCrimeData } from "./utils/crimeDataProcessing";
import { CircularProgress, Box, Typography, Tabs, Tab, ToggleButton, ToggleButtonGroup } from '@mui/material';

function TabContent({ district, setSelectedSupervisors }) {
  const [allData, setAllData] = useState([]);
  const [crimeDashData, setCrimeDashData] = useState([]);
  const [districtData, setDistrictData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [incidentData, setIncidentData] = useState([]);
  const [dateRange, setDateRange] = useState("lastTwoWeeks");
  const [startDateRecent, setStartDateRecent] = useState(new Date());
  const [endDateRecent, setEndDateRecent] = useState(new Date());
  const [startDateComparison, setStartDateComparison] = useState(new Date());
  const [endDateComparison, setEndDateComparison] = useState(new Date());

  useEffect(() => {
    setActiveTab("dashboard");
  }, [district]);

  useEffect(() => {
    setInitialDates();
  }, [dateRange]);

  useEffect(() => {
    fetchDistrictData(district);
  }, [district, dateRange, startDateRecent, endDateRecent, startDateComparison, endDateComparison]);

  const setInitialDates = () => {
    const today = new Date();
    const yesterdayMidnight = new Date(today);
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setHours(23, 59, 59, 999);

    let startDateRecent, endDateRecent, startDateComparison, endDateComparison;

    switch (dateRange) {
      case "lastTwoWeeks":
        endDateRecent = new Date(yesterdayMidnight);
        startDateRecent = new Date(endDateRecent);
        startDateRecent.setDate(startDateRecent.getDate() - 14);

        endDateComparison = new Date(startDateRecent);
        endDateComparison.setDate(endDateComparison.getDate() - 1);
        startDateComparison = new Date(endDateComparison);
        startDateComparison.setDate(startDateComparison.getDate() - 364);
        break;
      case "lastMonth":
        endDateRecent = new Date(yesterdayMidnight);
        startDateRecent = new Date(endDateRecent);
        startDateRecent.setDate(startDateRecent.getDate() - 28);

        endDateComparison = new Date(startDateRecent);
        endDateComparison.setDate(endDateComparison.getDate() - 1);
        startDateComparison = new Date(endDateComparison);
        startDateComparison.setDate(startDateComparison.getDate() - 364);
        break;
      case "yearToDate":
        endDateRecent = new Date(yesterdayMidnight);
        startDateRecent = new Date(endDateRecent.getFullYear(), 0, 1);

        endDateComparison = new Date(startDateRecent);
        endDateComparison.setFullYear(endDateComparison.getFullYear() - 1);
        startDateComparison = new Date(endDateComparison.getFullYear(), 0, 1);

        break;
      default:
        break;
    }

    setStartDateRecent(startDateRecent);
    setEndDateRecent(endDateRecent);
    setStartDateComparison(startDateComparison);
    setEndDateComparison(endDateComparison);
  };

  const fetchDistrictData = async (district) => {
    setIsLoading(true);

    const supervisorQueryObject = getSupervisorQuery();
    const supervisorData = await fetchDataFromAPI(supervisorQueryObject);
    setSelectedSupervisors(supervisorData);

    if (startDateRecent && endDateRecent && startDateComparison && endDateComparison) {
      const incidentQueryObject = getIncidentQuery(startDateRecent, endDateRecent, startDateComparison, endDateComparison, district);
      const fetchedData = await fetchDataFromAPI(incidentQueryObject);
      const { groupedData, metadata } = processData(fetchedData, startDateRecent, endDateRecent, startDateComparison, endDateComparison);
      setAllData(groupedData || []);
      setMetadata(metadata || {});

      const crimeDashData = processCrimeData(fetchedData, startDateRecent, endDateRecent, startDateComparison, endDateComparison);
      setCrimeDashData(crimeDashData);

      const districtGeoJsonData = {
        type: "FeatureCollection",
        features: supervisorData.map((item) => ({
          type: "Feature",
          properties: {
            district: item.sup_dist_num,
            supervisor: item.sup_name,
          },
          geometry: item.multipolygon,
        })).filter(feature => feature !== null),
      };
      setDistrictData(districtGeoJsonData);
    } else {
      console.error("One or more date variables are null");
    }

    setIsLoading(false);
  };

  const handleAnomalyClick = async (anomaly) => {
    const toDate = new Date().toISOString().split("T")[0] + "T23:59:59";
    const fromDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0] + "T00:00:00";

    const fetchedIncidentData = await fetchDataFromAPI(getAnomalyQuery(fromDate, toDate, anomaly.category));
    setIncidentData(fetchedIncidentData || []);
  };

  const handleDateRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setDateRange(newRange);
    }
  };

  return (
    <Box>
      <Box>
        <Typography variant="h4" gutterBottom>
          {district ? `District ${district}` : "Citywide"}
        </Typography>
        <Box display="flex" alignItems="center" mb={2}>
          {district ? (
            <Typography variant="h6" gutterBottom>
              {`Supervisor: ${districtData?.features.find(feature => feature.properties.district === district)?.properties.supervisor || ''}`}
            </Typography>
          ) : (
            <>
              <Box mr={2}>
                <img 
                  src="https://www.sf.gov/sites/default/files/styles/profile/public/2022-11/London%20Breed%20headshot.jpg?itok=A9k60vD-" 
                  alt="Mayor London Breed" 
                  style={{ width: "100px", height: "auto", borderRadius: "50%" }}
                />
              </Box>
              <Typography variant="h6" gutterBottom>
                Mayor London Breed
              </Typography>
            </>
          )}
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <ToggleButtonGroup
            value={dateRange}
            exclusive
            onChange={handleDateRangeChange}
            aria-label="date range"
          >
            <ToggleButton value="lastTwoWeeks" aria-label="last two weeks">
              Last Two Weeks
            </ToggleButton>
            <ToggleButton value="lastMonth" aria-label="last month">
              Last Month
            </ToggleButton>
            <ToggleButton value="yearToDate" aria-label="year to date">
              Year to Date
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab value="dashboard" label="Dashboard" />
        <Tab value="details" label="Details" />
        <Tab value="alerts" label="Alerts" />
      </Tabs>
      <Box mt={2}>
        {activeTab === "dashboard" && (isLoading ? <CircularProgress /> : <CrimeDash data={crimeDashData} metadata={metadata} districtData={districtData} />)}
        {activeTab === "details" && (isLoading ? <CircularProgress /> : <ErrorBarCharts data={allData} metadata={metadata} />)}
        {activeTab === "alerts" && (
          <AnomalyDisplay data={allData} metadata={metadata} district={district} onAnomalyClick={handleAnomalyClick} />
        )}
      </Box>
    </Box>
  );
}

export default TabContent;
