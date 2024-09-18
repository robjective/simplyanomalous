import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";
import styles from "./AnomalyDisplay.module.css";
import { format } from "date-fns";
import { fetchDataFromAPI } from './utils/api';
import { processData } from './utils/dataProcessing';


import {
  getSupervisorQuery,
  getIncidentQuery,
  getCategoryComparisonQuery,
} from './utils/queries';

function AnomalyDisplay({ district, onAnomalyClick }) {
  const [anomalies, setAnomalies] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [startDateRecent, setStartDateRecent] = useState(new Date());
  const [endDateRecent, setEndDateRecent] = useState(new Date());
  const [startDateComparison, setStartDateComparison] = useState(new Date());
  const [endDateComparison, setEndDateComparison] = useState(new Date());
  const [data, setAllData] = useState([]);
  const [metadata, setMetadata] = useState({});


   // Date Calculation Logic (Move outside useEffect)
const calculateDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // Find the most recent Sunday (start of the last complete week)
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - dayOfWeek - 7);
  lastSunday.setHours(23, 59, 59, 999);
  
  // Find the end of the second-to-last week (Saturday)
  const endOfSecondToLastWeek = new Date(lastSunday);
  endOfSecondToLastWeek.setDate(lastSunday.getDate() - 1);
  
  // Find the start of the second-to-last week (two weeks ago Sunday)
  const startOfSecondToLastWeek = new Date(endOfSecondToLastWeek);
  startOfSecondToLastWeek.setDate(endOfSecondToLastWeek.getDate() - 13);
  
  // Define the comparison period (52 weeks before the start of the recent period)
  const calculatedEndDateComparison = new Date(startOfSecondToLastWeek);
  calculatedEndDateComparison.setDate(calculatedEndDateComparison.getDate() - 1);
  const calculatedStartDateComparison = new Date(calculatedEndDateComparison);
  calculatedStartDateComparison.setDate(calculatedEndDateComparison.getDate() - 364); // 52 weeks = 364 days
  
  return {
    calculatedStartDateRecent: startOfSecondToLastWeek,
    calculatedEndDateRecent: lastSunday,
    calculatedStartDateComparison,
    calculatedEndDateComparison,
  };
};


  // If data is not provided, fetch the data using another useEffect
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      console.log("No data passed in, fetching it");

      const { 
        calculatedStartDateRecent, 
        calculatedEndDateRecent, 
        calculatedStartDateComparison, 
        calculatedEndDateComparison 
      } = calculateDates();

      // Set the calculated dates in state
      setStartDateRecent(calculatedStartDateRecent);
      setEndDateRecent(calculatedEndDateRecent);
      setStartDateComparison(calculatedStartDateComparison);
      setEndDateComparison(calculatedEndDateComparison);

      // Fetch all data concurrently
      Promise.all([
        fetchDataFromAPI(
          getIncidentQuery(
            calculatedStartDateRecent,
            calculatedEndDateRecent,
            calculatedStartDateComparison,
            calculatedEndDateComparison,
            district
          )
        ),
        fetchDataFromAPI(
          getCategoryComparisonQuery(
            calculatedStartDateRecent,
            calculatedEndDateRecent,
            calculatedStartDateComparison,
            calculatedEndDateComparison,
            district
          )
        ),
      ]).then(([incidentData, crimeDashData]) => {
        // Process and set incident data
        console.log('Processing incident data');
        const { groupedData, metadata } = processData(
          incidentData,
          calculatedStartDateRecent,
          calculatedEndDateRecent,
          calculatedStartDateComparison,
          calculatedEndDateComparison
        );
        setAllData(groupedData || []);
        setMetadata(metadata || {});

        const results = calculateStatisticsAndAnomalies(groupedData);
        const sortedAnomalies = results.anomalies.sort((a, b) => {
          const deltaA = Math.abs(a.recentAvg - a.longTermAvg);
          const deltaB = Math.abs(b.recentAvg - b.longTermAvg);
          return deltaB - deltaA;
        });
        setAnomalies(sortedAnomalies);
        setStatistics(results.statistics);
      });
    }
  }, [data, district]);

  // Main data processing and setting state
  useEffect(() => {
    console.log('useEffect called for data processing');
    console.log('Data:', data);
    console.log('Metadata:', metadata);
    
    if (data && Object.keys(data).length > 0) {
      const results = calculateStatisticsAndAnomalies(data);
      const sortedAnomalies = results.anomalies.sort((a, b) => {
        const deltaA = Math.abs(a.recentAvg - a.longTermAvg);
        const deltaB = Math.abs(b.recentAvg - b.longTermAvg);
        return deltaB - deltaA;
      });
      setAnomalies(sortedAnomalies);
      setStatistics(results.statistics);
    }
  }, [data]);

  const createPlot = (anomaly) => {
    const stat = statistics.find((stat) => stat.category === anomaly.category);
    if (!stat || !stat.entries || stat.entries.length === 0) return null;
  
    const { entries } = stat;
  
    // Define the date ranges
    const comparisonStartDate = new Date(metadata.comparisonStart);
    const comparisonEndDate = new Date(metadata.comparisonEnd || metadata.recentStart);
    const recentStartDate = new Date(metadata.recentStart);
    const recentEndDate = new Date(metadata.recentEnd);
  
    // Extract xValues and yValues from entries
    const xValuesAll = entries.map((entry) => entry.date.toISOString().substring(0, 10));
    const yValuesAll = entries.map((entry) => entry.count);
  
    // Split entries into comparison and recent periods
    const entriesComparison = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= comparisonStartDate && entryDate < recentStartDate;
    });
  
    const entriesRecent = entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= recentStartDate && entryDate <= recentEndDate;
    });
  
    // Prepare data for comparison period
    const xValuesComparison = entriesComparison.map((entry) => entry.date.toISOString().substring(0, 10));
    const yValuesComparison = entriesComparison.map((entry) => entry.count);
  
    // Prepare data for recent period
    const xValuesRecent = entriesRecent.map((entry) => entry.date.toISOString().substring(0, 10));
    const yValuesRecent = entriesRecent.map((entry) => entry.count);
  
    // Create arrays for average lines
    const comparisonAvgLineX = [xValuesComparison[0], xValuesComparison[xValuesComparison.length - 1]];
    const comparisonAvgLineY = [anomaly.comparisonAvg, anomaly.comparisonAvg];
  
    const recentAvgLineX = [xValuesRecent[0], xValuesRecent[xValuesRecent.length - 1]];
    const recentAvgLineY = [anomaly.recentAvg, anomaly.recentAvg];
  
    // Normal range shading over the entire period
    const plus2SigmaArray = xValuesAll.map(() => anomaly.comparisonAvg + 2 * anomaly.comparisonStdDev);
    const minus2SigmaArray = xValuesAll.map(() => anomaly.comparisonAvg - 2 * anomaly.comparisonStdDev);
  
    return (
      <div className={styles.plotContainer}>
        <Plot
          data={[
            // Shaded Normal Range Area
            {
              type: "scatter",
              x: xValuesAll,
              y: plus2SigmaArray,
              mode: "lines",
              line: { color: "transparent" },
              showlegend: false,
              hoverinfo: "skip",
            },
            {
              type: "scatter",
              x: xValuesAll,
              y: minus2SigmaArray,
              mode: "lines",
              line: { color: "transparent" },
              fill: "tonexty",
              fillcolor: "rgba(200,200,200,0.3)",
              name: "Normal Range",
              showlegend: false,
              hoverinfo: "skip",
            },
            // Comparison Period Data
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValuesComparison,
              y: yValuesComparison,
              marker: { size: 4, color: "grey" },
              line: { color: "grey" },
              name: "Comparison Period",
              showlegend: false,
            },
            // Recent Period Data
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValuesRecent,
              y: yValuesRecent,
              marker: { size: 4, color: "gold" },
              line: { color: "gold" },
              name: "Recent Period",
              showlegend: false,
            },
            // Comparison Average Line
            {
              type: "scatter",
              mode: "lines",
              x: comparisonAvgLineX,
              y: comparisonAvgLineY,
              line: { color: "grey", width: 4 },
              name: "Comparison Average",
              showlegend: false,
            },
            // Recent Average Line
            {
              type: "scatter",
              mode: "lines",
              x: recentAvgLineX,
              y: recentAvgLineY,
              line: { color: "gold", width: 4 },
              name: "Recent Average",
              showlegend: false,
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 40, r: 20, t: 20, b: 45 },
            showlegend: false, // Hide the legend
            xaxis: { title: "Week" },
            yaxis: {
              title: "Police Reports Per Week",
              titlefont: { standoff: 10 },
              range: [
                0,
                Math.max(
                  ...yValuesAll.concat(plus2SigmaArray).filter((y) => y !== null)
                ) + (anomaly.comparisonStdDev || 0),
              ],
            },
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "400px" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    );
  };
  
  
  
  

  return (
    <div className={styles.anomalyContainer}>
      {anomalies.length > 0 ? (
        anomalies.map((anomaly, index) => (
          <div
            key={index}
            className={`${styles.anomalyItem} ${
              anomaly.recentAvg > anomaly.comparisonAvg ? styles.positive : styles.negative
            }`}
          >
            <div className={styles.title}>{getHeadline(anomaly, district)}</div>
            {createPlot(anomaly)}
            <div className={styles.bodyText}>{getText(anomaly, metadata)}</div>
          </div>
        ))
      ) : (
        <p>No anomalies found.</p>
      )}
    </div>
  );
}

export default AnomalyDisplay;

function getHeadline(anomaly, district) {
  const trend = anomaly.recentAvg > anomaly.comparisonAvg ? "Up" : "Down";
  return `${district ? `SF District ${district}` : "SF"} ${anomaly.category} Police Reports Are ${trend}`;
}

function getText(anomaly, metadata) {
  if (!metadata || !anomaly) {
    console.log("Metadata or anomaly is undefined.");
    return <span>Data is loading or incomplete...</span>;
  }
  console.log(anomaly);
  try {
    const recentPeriodEndFormatted = format(new Date(metadata.recentEnd), 'MMM dd');
    const recentPeriodStartFormatted = format(new Date(metadata.recentStart), 'MMM dd');
    const { recentAvg, comparisonAvg, comparisonStdDev } = anomaly;

    // Calculate the percentage difference
    const diff = comparisonAvg
      ? Math.round(((recentAvg - comparisonAvg) / comparisonAvg) * 100)
      : 0;

    const trend = recentAvg > comparisonAvg ? "more" : "less";
    const diffColor = trend === "more" ? "red" : "green";

    // Calculate the normal range
    const upperBound = Math.round(comparisonAvg + 2 * comparisonStdDev);
    const lowerBound = Math.round(comparisonAvg - 2 * comparisonStdDev);
    const text = `Between ${recentPeriodStartFormatted} and ${recentPeriodEndFormatted}, ${
      metadata.district ? `SF District ${metadata.district}` : "SF"
    } saw an average of ${Math.round(recentAvg)} police reports of ${anomaly.category} filed per week, which is <span style="color:${diffColor}">${diff}%</span> ${trend} than the comparison average of ${Math.round(
      comparisonAvg
    )} reports per week. This average falls within the normal range of ${lowerBound} to ${upperBound} reports per week based on the comparison period.`;

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  } catch (error) {
    console.error("Error parsing date:", error);
    return <span>Error parsing date. Check console for details.</span>;
  }
}
