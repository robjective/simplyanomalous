import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import { calculateStatisticsAndAnomalies } from "./utils/dataProcessing";

function ErrorBarCharts({ data, metadata }) {
  const [plots, setPlots] = useState([]);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      const { statistics } = calculateStatisticsAndAnomalies(data);
      setPlots(createPlots(statistics, metadata));
    }
  }, [data]);

  const createPlots = (statistics, metadata) => {
    if (!metadata) {
      console.error("Metadata is undefined");
      return [];
    }

    const standardizedYear = "2000"; // Standard year for X-axis visualization

    const standardizeDate = (date) => {
      const newDate = new Date(date);
      newDate.setFullYear(standardizedYear);
      return newDate.toISOString().substring(0, 10); // Adjust to standard year
    };

    return statistics.map(({ category, entries }) => {
      // Map entries to a standardized year format and sort them
      const entriesWithStandardYear = entries.map(entry => ({
        ...entry,
        date: standardizeDate(entry.date),
        period: entry.date >= metadata.recentStart && entry.date <= metadata.recentEnd ? 'Recent' : 'Comparison'
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Filter and sort by period
      const recentEntries = entriesWithStandardYear.filter(entry => entry.period === 'Recent');
      const comparisonEntries = entriesWithStandardYear.filter(entry => entry.period === 'Comparison');

      return (
        <Plot
          key={category}
          data={[
            {
              type: "scatter",
              mode: "lines+markers",
              x: recentEntries.map(entry => entry.date),
              y: recentEntries.map(entry => entry.count),
              marker: { color: 'orange' },
              name: 'Recent'
            },
            {
              type: "scatter",
              mode: "lines+markers",
              x: comparisonEntries.map(entry => entry.date),
              y: comparisonEntries.map(entry => entry.count),
              marker: { color: 'blue' },
              name: 'Comparison'
            }
          ]}
          layout={{
            title: category,
            xaxis: { title: "Day of the Year", tickformat: "%b %d", type: "date", range: [`${standardizedYear}-01-01`, `${standardizedYear}-12-31`] },
            yaxis: { title: "Count", rangemode: 'tozero' },
            width: 600,
            height: 400,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            showlegend: false
          }}
        />
      );
    });
  };

  return <div>{plots}</div>;
}

export default ErrorBarCharts;
