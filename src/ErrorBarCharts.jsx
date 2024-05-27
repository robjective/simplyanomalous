import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";

function ErrorBarCharts({ data }) {
  const [plots, setPlots] = useState([]);

  useEffect(() => {
    console.log("ErrorBarCharts Data:", data);
    if (data && Object.keys(data).length > 0) {
      const { statistics } = calculateStatisticsAndAnomalies(data);
      console.log("Statistics:", statistics); // Debugging log
      setPlots(createPlots(statistics));
    }
  }, [data]);

  const createPlots = (statistics) => {
    return statistics.map(({ category, entries, longTermAvg, stdDev }) => {
      if (!Array.isArray(entries)) {
        console.error("Entries is not an array:", entries); // Debugging log
        return null; // Skip invalid entries
      }

      const xValues = entries.map((entry) =>
        entry.date.toISOString().substring(0, 10),
      );
      const yValues = entries.map((entry) => entry.count);

      console.log("Creating plot for category:", category); // Debugging log
      //console.log('xValues:', xValues); // Debugging log
      //console.log('yValues:', yValues); // Debugging log

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
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg),
              name: "Long-Term Avg",
              line: { color: "blue" },
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg + stdDev),
              name: "+1 Std Dev",
              line: { color: "green" },
              fill: "tonexty",
              fillcolor: "rgba(0, 255, 0, 0.3)",
            },
            {
              type: "scatter",
              mode: "lines",
              x: xValues,
              y: Array(xValues.length).fill(longTermAvg - stdDev),
              name: "-1 Std Dev",
              line: { color: "red" },
              fill: "tonexty",
              fillcolor: "rgba(255, 0, 0, 0.3)",
            },
          ]}
          layout={{
            title: category,
            xaxis: { title: "Week" },
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
