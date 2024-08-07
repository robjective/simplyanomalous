import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";
import styles from "./AnomalyDisplay.module.css";
import { format } from "date-fns";

function AnomalyDisplay({ data, metadata, district, onAnomalyClick }) {
  const [anomalies, setAnomalies] = useState([]);
  const [statistics, setStatistics] = useState([]);

  useEffect(() => {
    console.log('useEffect called');
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

    const { entries, longTermAvg, stdDev } = stat;
    const plotStartDate = new Date(metadata.longTermStart);
    const plotEndDate = new Date(metadata.recentEnd);
    const recentStartDate = new Date(metadata.recentStart);
    const recentEndDate = new Date(metadata.recentEnd);

    const longTermEntries = entries.filter(
      (entry) => new Date(entry.date) >= plotStartDate && new Date(entry.date) <= plotEndDate
    );
    const recentEntries = entries.filter(
      (entry) => new Date(entry.date) >= recentStartDate && new Date(entry.date) <= recentEndDate
    );

    const xValuesLongTerm = longTermEntries.map((entry) => entry.date.toISOString().substring(0, 10));
    const yValuesLongTerm = longTermEntries.map((entry) => entry.count);

    const xValuesRecent = recentEntries.map((entry) => entry.date.toISOString().substring(0, 10));
    const yValuesRecent = recentEntries.map((entry) => entry.count);

    const xValues = Array.from(new Set([...xValuesLongTerm, ...xValuesRecent])).sort();

    const yValuesLongTermFilled = xValues.map((date) => {
      const entry = longTermEntries.find((entry) => entry.date.toISOString().substring(0, 10) === date);
      return entry ? entry.count : null;
    });

    const yValuesRecentFilled = xValues.map((date) => {
      const entry = recentEntries.find((entry) => entry.date.toISOString().substring(0, 10) === date);
      return entry ? entry.count : null;
    });

    return (
      <div className={styles.plotContainer}>
        <Plot
          data={[
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValues,
              y: yValuesLongTermFilled,
              marker: { size: 4, color: "grey" },
              name: "Long Term",
              showlegend: false,
            },
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValues,
              y: yValuesRecentFilled,
              marker: { size: 6, color: "gold" },
              name: `Last ${metadata.recentDays} Days`,
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg),
              line: { color: "darkgrey" },
              name: "Normal Range",
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg + stdDev),
              line: { color: "darkgrey" },
              fill: "tonexty",
              fillcolor: "rgba(255, 0, 0, 0.3)",
              showlegend: false,
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg - stdDev),
              line: { color: "darkgrey" },
              fill: "tonexty",
              fillcolor: "rgba(0, 128, 0, 0.3)",
              showlegend: false,
            },
          ]}
          layout={{
            autosize: true,
            margin: { l: 40, r: 20, t: 20, b: 45 },
            showlegend: true,
            legend: { x: 0, y: 1, orientation: "h" },
            xaxis: { title: "Week" },
            yaxis: {
              title: "Police Reports Per Week",
              titlefont: { standoff: 10 },
              range: [0, Math.max(...yValuesLongTerm.concat(yValuesRecent).filter(y => y !== null)) + stdDev],
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
              anomaly.recentAvg > anomaly.longTermAvg ? styles.positive : styles.negative
            }`}
            onClick={() => onAnomalyClick(anomaly)}
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
  const trend = anomaly.recentAvg > anomaly.longTermAvg ? "Up" : "Down";
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
    const { recentAvg, longTermAvg, previousYearAvg, yoyChange } = anomaly;
    const diff = Math.round((Math.abs(longTermAvg - recentAvg) / longTermAvg) * 100);
    const trend = recentAvg > longTermAvg ? "more" : "less";
    const yoyTrend = yoyChange > 0 ? "up" : "down";
    const diffColor = trend === "more" ? "red" : "green";
    const yoyColor = yoyTrend === "up" ? "red" : "green";
    const yoyDiff = Math.round(Math.abs(yoyChange));
    const yoyDiffWord = yoyTrend === "up" ? "more" : "fewer";
    const text = `Between ${recentPeriodStartFormatted} and ${recentPeriodEndFormatted}, ${
      metadata.district ? `SF District ${metadata.district}` : "SF"
    } saw an average of ${Math.round(recentAvg)} police reports of ${anomaly.category} filed per week, <span style="color:${diffColor}">${diff}%</span> ${trend} than the 1 year average of ${Math.round(
      longTermAvg
    )} reports a week. Last year over the same period there were ${Math.round(
      previousYearAvg
    )} incidents reported vs this year's total of ${Math.round(
      recentAvg
    )}, a difference of <span style="color:${yoyColor}">${yoyDiff} ${yoyDiffWord} incidents</span>.`;

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  } catch (error) {
    console.error("Error parsing date:", error);
    return <span>Error parsing date. Check console for details.</span>;
  }
}
