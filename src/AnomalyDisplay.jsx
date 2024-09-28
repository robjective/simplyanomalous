import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";
import styles from "./AnomalyDisplay.module.css";
import { format } from "date-fns";
import { fetchDataFromAPI } from './utils/api';
import { processData } from './utils/dataProcessing';
import { getAnomalyQuery } from './utils/queries';
import { startOfWeek, subWeeks, subDays } from 'date-fns';

function AnomalyDisplay({ district }) {
  const [anomalies, setAnomalies] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [startDateRecent, setStartDateRecent] = useState(new Date());
  const [endDateRecent, setEndDateRecent] = useState(new Date());
  const [startDateComparison, setStartDateComparison] = useState(new Date());
  const [endDateComparison, setEndDateComparison] = useState(new Date());
  const [data, setAllData] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [rowsLoaded, setRowsLoaded] = useState(0);

  const [outOfBoundsAnomalies, setOutOfBoundsAnomalies] = useState([]);
  const [inBoundsCategories, setInBoundsCategories] = useState([]);

  const [isInBoundsExpanded, setIsInBoundsExpanded] = useState(false); // State for toggling the in-bounds categories list

  // Date Calculation Logic
  const calculateDates = () => {
    const today = new Date();
    
    // Get the most recent Sunday
    const endOfRecentPeriod = startOfWeek(today, { weekStartsOn: 0 }); // Start of the current week where Sunday is the start (0)
    
    // Define the recent period as the two weeks ending the most recent Sunday
    const calculatedEndDateRecent = subDays(endOfRecentPeriod, 1); // Most recent Sunday
    const calculatedStartDateRecent = subWeeks(calculatedEndDateRecent, 2); // Two weeks before end date
    
    // Define the comparison period as the 52 weeks before the recent period
    const calculatedEndDateComparison = subDays(calculatedStartDateRecent, 1); // One day before the recent period starts
    const calculatedStartDateComparison = subDays(calculatedEndDateComparison, 364); // 52 weeks = 364 days
  
    return {
      calculatedStartDateRecent,
      calculatedEndDateRecent,
      calculatedStartDateComparison,
      calculatedEndDateComparison,
    };
  };

  // Fetch data if not provided
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      console.log("No data passed in, fetching it");
      setRowsLoaded(0); // Reset rowsLoaded
      setLoading(true);

      const {
        calculatedStartDateRecent,
        calculatedEndDateRecent,
        calculatedStartDateComparison,
        calculatedEndDateComparison,
      } = calculateDates();

      // Set the calculated dates in state
      setStartDateRecent(calculatedStartDateRecent);
      setEndDateRecent(calculatedEndDateRecent);
      setStartDateComparison(calculatedStartDateComparison);
      setEndDateComparison(calculatedEndDateComparison);

      console.log('Dates:', calculatedStartDateRecent, calculatedEndDateRecent, calculatedStartDateComparison, calculatedEndDateComparison);

      // Fetch all data concurrently
      fetchDataFromAPI(
        getAnomalyQuery(
          calculatedStartDateRecent,
          calculatedEndDateRecent,
          calculatedStartDateComparison,
          calculatedEndDateComparison,
          district
        ),
        null,          // No need for updateLoadingCount in this context
        setRowsLoaded  // Pass setRowsLoaded as updateProgress
      ).then((incidentData) => {
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
          const deltaA = Math.abs(a.recentAvg - a.comparisonAvg);
          const deltaB = Math.abs(b.recentAvg - b.comparisonAvg);
          return deltaB - deltaA;
        });

        setAnomalies(sortedAnomalies);
        setStatistics(results.statistics);

        // Separate out-of-bounds anomalies and in-bounds categories using `outOfBounds`
        const outOfBounds = sortedAnomalies.filter(anomaly => anomaly.outOfBounds);
        const inBounds = sortedAnomalies.filter(anomaly => !anomaly.outOfBounds);

        setOutOfBoundsAnomalies(outOfBounds);
        setInBoundsCategories(inBounds);

        setLoading(false); // Data fetching and processing done
      });
    }
  }, [data, district]);

  // Main data processing
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      console.log('useEffect called for data processing');
      const results = calculateStatisticsAndAnomalies(data);
      const sortedAnomalies = results.anomalies.sort((a, b) => {
        const deltaA = Math.abs(a.recentAvg - a.comparisonAvg);
        const deltaB = Math.abs(b.recentAvg - b.comparisonAvg);
        return deltaB - deltaA;
      });

      setAnomalies(sortedAnomalies);
      setStatistics(results.statistics);

      // Separate out-of-bounds anomalies and in-bounds categories using `outOfBounds`
      const outOfBounds = sortedAnomalies.filter(anomaly => anomaly.outOfBounds);
      const inBounds = sortedAnomalies.filter(anomaly => !anomaly.outOfBounds);

      setOutOfBoundsAnomalies(outOfBounds);
      setInBoundsCategories(inBounds);
    }
  }, [data]);

  const createPlot = (anomaly) => {
    if (!anomaly.outOfBounds) {
      return null; // Only plot anomalies marked as out of bounds
    }

    const stat = statistics.find((stat) => stat.category === anomaly.category);
    if (!stat || !stat.entries || stat.entries.length === 0) return null;

    const { entries } = anomaly;

    // Sort entries by date in ascending order
    entries.sort((a, b) => a.date - b.date);

    // Define the date ranges
    const recentStartDate = new Date(metadata.recentStart);

    // Extract xValues and yValues from entries
    const xValuesAll = entries.map((entry) =>
      entry.date.toISOString().substring(0, 10)
    );
    const yValuesAll = entries.map((entry) => entry.count);

    // Find the index where the recent period starts
    const splitIndex = entries.findIndex(
      (entry) => entry.date >= recentStartDate
    );

    // Ensure the lines connect by including the first point of the recent period in the comparison array
    const xValuesComparison = xValuesAll.slice(0, splitIndex + 1); // Include the first point of the recent period
    const yValuesComparison = yValuesAll.slice(0, splitIndex + 1); // Include the first point of the recent period

    const xValuesRecent = xValuesAll.slice(splitIndex); // Start from the split index (original recent period)
    const yValuesRecent = yValuesAll.slice(splitIndex); // Start from the split index (original recent period)

    // Normal range shading over the entire period
    const plus2SigmaArray = xValuesAll.map(
      () => anomaly.comparisonAvg + 2 * anomaly.comparisonStdDev
    );
    const minus2SigmaArray = xValuesAll.map(
      () => anomaly.comparisonAvg - 2 * anomaly.comparisonStdDev
    );

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
            // Combined Line for Comparison Period
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
            // Combined Line for Recent Period
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
          ]}
          layout={{
            autosize: true,
            margin: { l: 40, r: 20, t: 20, b: 45 },
            showlegend: false,
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

  // Calculate totals for in-bounds categories
  const totalCategories = anomalies.length;
  const totalInBoundsCategories = inBoundsCategories.length;
  const percentageInBoundsCategories = ((totalInBoundsCategories / totalCategories) * 100).toFixed(1);

  const totalIncidents = anomalies.reduce((sum, anomaly) => sum + anomaly.recentAvg, 0);
  const totalInBoundsIncidents = inBoundsCategories.reduce((sum, anomaly) => sum + anomaly.recentAvg, 0);
  const percentageInBoundsIncidents = ((totalInBoundsIncidents / totalIncidents) * 100).toFixed(1);

  const triangleIcon = isInBoundsExpanded ? '▼' : '▶';

  return (
    <div className={styles.anomalyContainer}>
      {loading ? (
        <p>Processing SFOpenData... {rowsLoaded} police incidents</p>
      ) : anomalies.length > 0 ? (
        <>
          {/* Display list of in-bounds categories */}
          {inBoundsCategories.length > 0 && (
            <div className={styles.inBoundsContainer}>
              <h2 onClick={() => setIsInBoundsExpanded(!isInBoundsExpanded)} className={styles.clickableHeader}>
                <span className={styles.triangleIcon}>{triangleIcon}</span> Categories within normal range ({totalInBoundsCategories} categories / {percentageInBoundsCategories}%)
              </h2>
              {isInBoundsExpanded && (
                <ul className={styles.inBoundsList}>
                  {inBoundsCategories.map((anomaly, index) => (
                    <li key={index}>
                      <strong>{anomaly.category}</strong>: Recent Avg: {Math.round(anomaly.recentAvg)}, Comparison Avg: {Math.round(anomaly.comparisonAvg)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Display anomalies that are out of bounds */}
          {outOfBoundsAnomalies.length > 0 ? (
            outOfBoundsAnomalies.map((anomaly, index) => (
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
            <p>No anomalies found out of bounds.</p>
          )}
        </>
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
    )} reports per week. This average falls outside the normal range of ${lowerBound} to ${upperBound} reports per week based on the comparison period.`;

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  } catch (error) {
    console.error("Error parsing date:", error);
    return <span>Error parsing date. Check console for details.</span>;
  }
}
