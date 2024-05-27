import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";
import styles from "./AnomalyDisplay.module.css"; // Import the CSS module
import { getISOWeek } from "date-fns";

function AnomalyDisplay({ data, metadata, district, onAnomalyClick }) {
  const [anomalies, setAnomalies] = useState([]);
  const [statistics, setStatistics] = useState([]);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const results = calculateStatisticsAndAnomalies(data);
      const filteredAnomalies = results.anomalies.filter(
        (anomaly) => anomaly.recentAvg > 0,
      );
      const sortedAnomalies = filteredAnomalies.sort((a, b) => {
        const percentChangeA =
          Math.abs((a.recentAvg - a.longTermAvg) / a.longTermAvg) * 100;
        const percentChangeB =
          Math.abs((b.recentAvg - b.longTermAvg) / b.longTermAvg) * 100;
        return percentChangeB - percentChangeA;
      });
      setAnomalies(sortedAnomalies);
      setStatistics(results.statistics);
    }
  }, [data]);

  const createPlot = (anomaly) => {
    const stat = statistics.find((stat) => stat.category === anomaly.category);
    if (!stat || !stat.entries || stat.entries.length === 0) return null;

    const { entries, longTermAvg, stdDev } = stat;
    const plotStartDate = new Date(metadata.longTermPeriod.split(" to ")[0]); // Use start date from metadata
    const filteredEntries = entries.filter(
      (entry) => entry.date >= plotStartDate,
    );
    const xValues = filteredEntries.map((entry) =>
      entry.date.toISOString().substring(0, 10),
    );
    const yValues = filteredEntries.map((entry) => entry.count);
    const recentValues = yValues.slice(-2);

    return (
      <div className={styles.plotContainer}>
        <Plot
          data={[
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValues,
              y: yValues,
              marker: { size: 4, color: "grey" },
              showlegend: false,
            },
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValues.slice(-metadata.numberOfRecentWeeks),
              y: recentValues,
              marker: { size: 6, color: "orange" },
              text: recentValues.map((val) => `Recent (${metadata.numberOfRecentWeeks} weeks): ${val}`),
              textposition: "top",
              showlegend: false,
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg),
              line: { color: "blue" },
              name: "1 Year Average",
              text: `Avg: ${longTermAvg.toFixed(2)}`,
              textposition: "top",
              textfont: { size: 12 },
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg + stdDev),
              line: { color: "lightgrey" },
              fill: "tonexty",
              fillcolor: "rgba(211, 211, 211, 0.5)", // Light grey shade
              name: "Normal Range",
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg - stdDev),
              line: { color: "lightgrey" },
              fill: "tonexty",
              fillcolor: "rgba(211, 211, 211, 0.5)", // Light grey shade
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
              range: [0, Math.max(...yValues) + stdDev],
            },
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "400px" }}
          config={{ responsive: true, displayModeBar: false }} // Disable the interactivity bar
        />
      </div>
    );
  };

  const getHeadline = (anomaly) => {
    const location = district ? `SF District ${district}` : "SF";
    const trend = anomaly.recentAvg > anomaly.longTermAvg ? "Up" : "Down";
    return `${location} ${anomaly.category} Police Reports Are ${trend}`;
  };

  const getText = (anomaly) => {
    const { recentAvg, longTermAvg, previousYearAvg, yoyChange } = anomaly;
    const diff = Math.round(
      (Math.abs(longTermAvg - recentAvg) / longTermAvg) * 100,
    );
    const trend = recentAvg > longTermAvg ? "more" : "less";
    const yoyTrend = yoyChange > 0 ? "up" : "down";
    const diffColor = trend === "more" ? "red" : "green";
    const yoyColor = yoyTrend === "up" ? "red" : "green";
    const recentPeriodEnd =
      metadata.recentPeriodLong.split(" to ")[1] +
      " " +
      new Date().getFullYear();
    const yoyDiff = Math.round(Math.abs(recentAvg - previousYearAvg));
    const yoyDiffWord = recentAvg > previousYearAvg ? "more" : "fewer";

    const text = `Between ${metadata.recentPeriodLong.split(" to ")[0]} and ${recentPeriodEnd}, ${
      district ? `SF District ${district}` : "SF"
    } saw an average of ${Math.round(
      recentAvg,
    )} police reports of ${anomaly.category} filed per week, <span style="color:${diffColor}">${diff}%</span> ${trend} than the 1 year average of ${Math.round(
      longTermAvg,
    )} reports a week. Last year over the same period there were ${Math.round(
      previousYearAvg,
    )} incidents reported vs this year's total of ${Math.round(
      recentAvg,
    )}, a difference of <span style="color:${yoyColor}">${yoyDiff} ${yoyDiffWord} incidents</span>.`;

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className={styles.anomalyContainer}>
      {anomalies.length > 0 ? (
        <div>
          {anomalies.map((anomaly, index) => {
            const text = getText(anomaly);

            return (
              <div
                key={index}
                className={`${styles.anomalyItem} ${
                  anomaly.recentAvg > anomaly.longTermAvg
                    ? styles.positive
                    : styles.negative
                }`}
                onClick={() => onAnomalyClick(anomaly)}
              >
                <div className={styles.title}>{getHeadline(anomaly)}</div>
                {createPlot(anomaly)}
                <div className={styles.bodyText}>{text}</div>
                <div className={styles.metadataText}>
                  Data Source:{" "}
                  <a
                    href={metadata.dataSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    San Francisco's open data
                  </a>
                  .
                </div>
                <div className={styles.metadataText}>
                  Specific Data Link:{" "}
                  <a
                    href={`https://data.sfgov.org/resource/wg3w-h783.json?$query=SELECT incident_category, date_extract_y(report_datetime) AS year, date_extract_woy(report_datetime) AS week, COUNT(*) AS count WHERE report_datetime >= '${new Date(
                      metadata.recentPeriodLong.split(" to ")[0],
                    )
                      .toISOString()
                      .replace("Z", "")}' AND report_datetime <= '${new Date(
                      metadata.recentPeriodLong.split(" to ")[1],
                    )
                      .toISOString()
                      .replace(
                        "Z",
                        "",
                      )}' AND incident_category = '${anomaly.category}' GROUP BY incident_category, year, week ORDER BY year, week`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Data
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p>No anomalies found.</p>
      )}
    </div>
  );
}

export default AnomalyDisplay;
