import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";

function ErrorBarCharts({ data, metadata }) {
  const [plots, setPlots] = useState([]);

  useEffect(() => {
    console.log("ErrorBarCharts Data:", data);
    if (data && Object.keys(data).length > 0) {
      const { statistics } = calculateStatisticsAndAnomalies(data);
      console.log("Statistics:", statistics); // Debugging log
      setPlots(createPlots(statistics, metadata));
    }
  }, [data]);

  const filterDates = (entries, startDate, endDate) => {
    return entries.filter(entry => entry.date >= startDate && entry.date <= endDate);
  };

  const createPlots = (statistics, metadata) => {
    if (!metadata) {
      console.error("Metadata is undefined");
      return [];
    }

    const { recentStart, recentEnd, comparisonStart, comparisonEnd } = metadata;

    return statistics.map(({ category, entries, recentAvg, comparisonAvg, recentStdDev, comparisonStdDev }) => {
      if (!Array.isArray(entries)) {
        console.error("Entries is not an array:", entries); // Debugging log
        return null; // Skip invalid entries
      }

      const xValues = entries.map((entry) => entry.date.toISOString().substring(0, 10));
      const yValues = entries.map((entry) => entry.count);

      const recentFilteredEntries = filterDates(entries, recentStart, recentEnd);
      const comparisonFilteredEntries = filterDates(entries, comparisonStart, comparisonEnd);

      const recentXValues = recentFilteredEntries.map((entry) => entry.date.toISOString().substring(0, 10));
      const comparisonXValues = comparisonFilteredEntries.map((entry) => entry.date.toISOString().substring(0, 10));

      console.log("Creating plot for category:", category); // Debugging log
      console.log("recentAvg:", recentAvg, "comparisonAvg:", comparisonAvg, "recentStdDev:", recentStdDev, "comparisonStdDev:", comparisonStdDev); // Debugging log

      return (
        <Plot
          key={category}
          data={[
            {
              type: "scatter",
              mode: "lines+markers",
              x: xValues,
              y: yValues,
              name: category,
              marker: { size: 4 },
            },
            {
              type: "scatter",
              mode: "lines",
              x: comparisonXValues,
              y: Array(comparisonXValues.length).fill(comparisonAvg),
              name: "Comparison Avg",
              line: { color: "blue" },
            },
            {
              type: "scatter",
              mode: "lines",
              x: comparisonXValues,
              y: Array(comparisonXValues.length).fill(comparisonAvg + comparisonStdDev),
              name: "+1 Std Dev (Comparison)",
              line: { color: "green" },
              fill: "tonexty",
              fillcolor: "rgba(0, 255, 0, 0.3)",
            },
            {
              type: "scatter",
              mode: "lines",
              x: comparisonXValues,
              y: Array(comparisonXValues.length).fill(comparisonAvg - comparisonStdDev),
              name: "-1 Std Dev (Comparison)",
              line: { color: "red" },
              fill: "tonexty",
              fillcolor: "rgba(255, 0, 0, 0.3)",
            },
            {
              type: "scatter",
              mode: "lines",
              x: recentXValues,
              y: Array(recentXValues.length).fill(recentAvg),
              name: "Recent Avg",
              line: { color: "purple" },
            },
            {
              type: "scatter",
              mode: "lines",
              x: recentXValues,
              y: Array(recentXValues.length).fill(recentAvg + recentStdDev),
              name: "+1 Std Dev (Recent)",
              line: { color: "orange" },
              fill: "tonexty",
              fillcolor: "rgba(255, 165, 0, 0.3)",
            },
            {
              type: "scatter",
              mode: "lines",
              x: recentXValues,
              y: Array(recentXValues.length).fill(recentAvg - recentStdDev),
              name: "-1 Std Dev (Recent)",
              line: { color: "yellow" },
              fill: "tonexty",
              fillcolor: "rgba(255, 255, 0, 0.3)",
            },
          ]}
          layout={{
            title: category,
            xaxis: { title: "Date" },
            yaxis: { title: "Count" },
            showlegend: false,
            width: 300,
            height: 200,
            margin: { l: 40, r: 10, t: 40, b: 30 },
          }}
        />
      );
    });
  };

  return <div>{plots}</div>;
}

export default ErrorBarCharts;
