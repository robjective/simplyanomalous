// TabContent.jsx

import React, { useState, useEffect } from 'react';
import ErrorBarCharts from './ErrorBarCharts';
import AnomalyDisplay from './AnomalyDisplay';
import CrimeDash from './CrimeDash';
import { fetchDataFromAPI } from './utils/api';
import {
  getSupervisorQuery,
  getIncidentQuery,
  getCategoryComparisonQuery,
} from './utils/queries';
import { processData } from './utils/dataProcessing';
import {
  CircularProgress,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

function TabContent({
  district,
  setSelectedSupervisors,
  activeTab = 'dashboard',
}) {
  const [allData, setAllData] = useState([]);
  const [crimeDashData, setCrimeDashData] = useState([]);
  const [districtData, setDistrictData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Single loading state
  const [metadata, setMetadata] = useState({});
  const [incidentData, setIncidentData] = useState([]);
  const [dateRange, setDateRange] = useState('yearToDate');
  const [startDateRecent, setStartDateRecent] = useState(new Date());
  const [endDateRecent, setEndDateRecent] = useState(new Date());
  const [startDateComparison, setStartDateComparison] = useState(new Date());
  const [endDateComparison, setEndDateComparison] = useState(new Date());

  // Set initial dates when dateRange changes
  useEffect(() => {
    setInitialDates();
  }, [dateRange]);

  // Fetch data when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      console.log('Starting data fetch, setting isLoading to true');
      setIsLoading(true); // Set loading state to true at the start
      try {
        await fetchDistrictData(district);
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        console.log('Data fetch complete, setting isLoading to false');
        setIsLoading(false); // Set loading state to false after fetching is done
      }
    };
    fetchData();
  }, [
    district,
    dateRange,
    startDateRecent,
    endDateRecent,
    startDateComparison,
    endDateComparison,
  ]);

  const setInitialDates = () => {
    const today = new Date();
    const yesterdayMidnight = new Date(today);
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setHours(23, 59, 59, 999);
    console.log("Running setInitialDates with dateRange:", dateRange);
    
    let startDateRecent,
      endDateRecent,
      startDateComparison,
      endDateComparison;

    switch (dateRange) {
      case 'lastTwoWeeks':
        const MS_PER_DAY = 24 * 60 * 60 * 1000;

        // Get the date of the most recent Saturday
        const recentSaturday = new Date(yesterdayMidnight);
        recentSaturday.setDate(
          recentSaturday.getDate() - ((recentSaturday.getDay() + 1) % 7)
        );
        console.log('Recent Saturday:', recentSaturday);
        // Set start and end dates for the recent period
        startDateRecent = new Date(recentSaturday);
        startDateRecent.setDate(recentSaturday.getDate() - 14);
        console.log('Recent Start Date:', startDateRecent);
        endDateRecent = new Date(recentSaturday);
        console.log('Recent End Date:', endDateRecent);

        // Set start and end dates for the comparison period (same weeks last year)
        startDateComparison = new Date(startDateRecent);
        startDateComparison.setFullYear(startDateComparison.getFullYear() - 1);
        console.log('Comparison Start Date:', startDateComparison);

        endDateComparison = new Date(endDateRecent);
        endDateComparison.setFullYear(endDateComparison.getFullYear() - 1);
        console.log('Comparison End Date:', endDateComparison);
        break;

      case 'lastMonth':
        endDateRecent = new Date(yesterdayMidnight);
        startDateRecent = new Date(endDateRecent);
        startDateRecent.setDate(startDateRecent.getDate() - 28);
        console.log('Recent Start Date (Last Month):', startDateRecent);
        console.log('Recent End Date (Last Month):', endDateRecent);

        endDateComparison = new Date(endDateRecent);
        endDateComparison.setFullYear(endDateComparison.getFullYear() - 1);
        console.log('Comparison End Date (Last Month):', endDateComparison);

        startDateComparison = new Date(startDateRecent);
        startDateComparison.setFullYear(startDateComparison.getFullYear() - 1);
        console.log('Comparison Start Date (Last Month):', startDateComparison);
        break;

      case 'yearToDate':
        endDateRecent = new Date(yesterdayMidnight);
        startDateRecent = new Date(endDateRecent.getFullYear(), 0, 1);
        console.log('Recent Start Date (Year To Date):', startDateRecent);
        console.log('Recent End Date (Year To Date):', endDateRecent);

        endDateComparison = new Date(endDateRecent);
        endDateComparison.setFullYear(endDateComparison.getFullYear() - 1);
        console.log('Comparison End Date (Year To Date):', endDateComparison);

        startDateComparison = new Date(endDateComparison.getFullYear(), 0, 1);
        console.log('Comparison Start Date (Year To Date):', startDateComparison);
        break;

      default:
        console.warn('Unknown dateRange:', dateRange);
        break;
    }

    setStartDateRecent(startDateRecent);
    setEndDateRecent(endDateRecent);
    setStartDateComparison(startDateComparison);
    setEndDateComparison(endDateComparison);
    console.log('Updated Dates - Start Recent:', startDateRecent, 'End Recent:', endDateRecent);
    console.log('Updated Dates - Start Comparison:', startDateComparison, 'End Comparison:', endDateComparison);
  };

  const fetchDistrictData = async (district) => {
    try {
      console.log('Fetching supervisor data');
      const supervisorData = await fetchDataFromAPI(getSupervisorQuery());
      setSelectedSupervisors(supervisorData);

      console.log('Fetching incident and comparison data');
      // Fetch all data concurrently and wait for all requests to finish
      const [incidentData, crimeDashData] = await Promise.all([
        fetchDataFromAPI(
          getIncidentQuery(
            startDateRecent,
            endDateRecent,
            startDateComparison,
            endDateComparison,
            district
          )
        ),
        fetchDataFromAPI(
          getCategoryComparisonQuery(
            startDateRecent,
            endDateRecent,
            startDateComparison,
            endDateComparison,
            district
          )
        ),
      ]);

      // Process and set incident data
      console.log('Processing incident data');
      
      const { groupedData, metadata } = processData(
        incidentData,
        startDateRecent,
        endDateRecent,
        startDateComparison,
        endDateComparison
      );
      setAllData(groupedData || []);
      setMetadata(metadata || {});
      // Set crime dashboard data
      console.log('Setting crime dashboard data');
      setCrimeDashData(crimeDashData || []);

      // Create and set district GeoJSON data
      console.log('Setting district GeoJSON data');
      const districtGeoJsonData = {
        type: 'FeatureCollection',
        features: supervisorData
          .map((item) => ({
            type: 'Feature',
            properties: {
              district: item.sup_dist_num,
              supervisor: item.sup_name,
            },
            geometry: item.multipolygon,
          }))
          .filter((feature) => feature !== null),
      };
      setDistrictData(districtGeoJsonData);
    } catch (error) {
      console.error('Error fetching district data:', error);
      // Optionally, set an error state to display to the user
    }
  };

  const handleDateRangeChange = (event, newRange) => {
    if (newRange !== null) {
      console.log('Date Range Changed to:', newRange);
      setDateRange(newRange);
    } else {
      console.log('Date Range Change Cancelled or Invalid:', newRange);
    }
  };

  return (
    <Box>
      <Box>
        <Typography variant="h6" gutterBottom>
            {district ? `District ${Math.floor(district)}` : 'Citywide'} Crime Dashboard
        </Typography>
        
        <Box display="flex" alignItems="center" mb={2}>
          {district ? (
            <Typography variant="h4" gutterBottom>
              {`Supervisor: ${
                districtData?.features.find(
                  (feature) => feature.properties.district === district
                )?.properties.supervisor || ''
              }`}
            </Typography>
          ) : (
            <>
              <Box mr={2}>
                <img
                  src="https://www.sf.gov/sites/default/files/styles/profile/public/2022-11/London%20Breed%20headshot.jpg?itok=A9k60vD-"
                  alt="Mayor London Breed"
                  style={{
                    width: '100px',
                    height: 'auto',
                    borderRadius: '50%',
                  }}
                />
              </Box>
              <Typography variant="h6" gutterBottom>
                Mayor London Breed
              </Typography>
            </>
          )}
        </Box>

        {/* Date Range Toggle */}
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
      <Box mt={2}>
        {isLoading ? (
          <div>
            <CircularProgress />
            <Typography variant="body1">Loading...</Typography>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <CrimeDash
                data={crimeDashData}
                metadata={metadata}
                districtData={districtData}
              />
            )}
            {activeTab === 'details' && (
              <ErrorBarCharts data={allData} metadata={metadata} />
            )}
            {activeTab === 'alerts' && (
              <AnomalyDisplay
                data={allData}
                metadata={metadata}
                district={district}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default TabContent;
