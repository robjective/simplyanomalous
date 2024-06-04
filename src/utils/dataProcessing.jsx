import { parseISO, isWithinInterval } from "date-fns";
import { getCategoryGroup } from "./categoryMappings.js";

export const processData = (data, recentStart, recentEnd, comparisonStart, comparisonEnd) => {
  const groupedData = {};

  // Initialize aggregate data structure for groups and categories
  const initializeCategoryData = () => ({
    entries: {},
    recentCounts: [],
    comparisonCounts: [],
    stats: {
      recentAvg: 0,
      comparisonAvg: 0,
      recentStdDev: 0,
      comparisonStdDev: 0,
      yoyChange: 0,
    },
  });

//  console.log('Initial Data:', data);
//  console.log('Date Intervals - Recent:', recentStart, recentEnd, 'Comparison:', comparisonStart, comparisonEnd);

  // Process each data item
  data.forEach((item) => {
    const { incident_category, date, count } = item;

    if (!date || !count) {
      console.error(`Missing data point skipped: Date: ${date}, Count: ${count}`);
      return;
    }

    const parsedDate = parseISO(date);
    if (isNaN(parsedDate.getTime())) {
      console.error(`Invalid date format skipped: Date: ${date}`);
      return;
    }

    const parsedCount = parseInt(count, 10);
    if (isNaN(parsedCount)) {
      console.error(`Invalid count format skipped: Date: ${date}, Count: ${count}`);
      return;
    }

    const categoryGroup = getCategoryGroup(incident_category);
    if (!groupedData[categoryGroup]) {
      groupedData[categoryGroup] = initializeCategoryData();
    }
    if (!groupedData[incident_category]) {
      groupedData[incident_category] = initializeCategoryData();
    }

    // Aggregate counts on the same date
    const dateKey = parsedDate.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
    groupedData[categoryGroup].entries[dateKey] = (groupedData[categoryGroup].entries[dateKey] || 0) + parsedCount;
    groupedData[incident_category].entries[dateKey] = (groupedData[incident_category].entries[dateKey] || 0) + parsedCount;
  });

  // Log aggregated entries
  console.log('Aggregated Entries:', groupedData);

  // Convert aggregated entries back to array format and populate counts
  Object.keys(groupedData).forEach(category => {
    if (category === "metadata") return;

    const entriesMap = groupedData[category].entries;
    groupedData[category].entries = Object.entries(entriesMap).map(([date, count]) => ({
      date: new Date(date),
      count
    }));

    // Populate counts for statistical calculations
    groupedData[category].entries.forEach(({ date, count }) => {
      if (isWithinInterval(date, { start: comparisonStart, end: comparisonEnd })) {
        groupedData[category].comparisonCounts.push(count);
      }
      if (isWithinInterval(date, { start: recentStart, end: recentEnd })) {
        groupedData[category].recentCounts.push(count);
      }
    });

    // Log counts for debugging
    //console.log(`Category: ${category}, Recent Counts:`, groupedData[category].recentCounts, 'Comparison Counts:', groupedData[category].comparisonCounts);

    // Calculate averages and standard deviations
    const calculateStats = (counts) => {
      if (counts.length === 0) return { average: 0, stdDev: 0 };
      const sum = counts.reduce((sum, val) => sum + val, 0);
      const average = sum / counts.length;
      const stdDev = Math.sqrt(
        counts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / counts.length
      );
      return { average, stdDev };
    };

    const { recentCounts, comparisonCounts } = groupedData[category];
    if (recentCounts.length > 0) {
      const recentStats = calculateStats(recentCounts);
      groupedData[category].stats.recentAvg = recentStats.average;
      groupedData[category].stats.recentStdDev = recentStats.stdDev;
      //console.log(`Recent Stats for ${category}:`, recentStats);
    }

    if (comparisonCounts.length > 0) {
      const comparisonStats = calculateStats(comparisonCounts);
      groupedData[category].stats.comparisonAvg = comparisonStats.average;
      groupedData[category].stats.comparisonStdDev = comparisonStats.stdDev;
      //console.log(`Comparison Stats for ${category}:`, comparisonStats);
    }

    if (groupedData[category].stats.recentAvg > 0 && groupedData[category].stats.comparisonAvg > 0) {
      groupedData[category].stats.yoyChange = ((groupedData[category].stats.recentAvg - groupedData[category].stats.comparisonAvg) / groupedData[category].stats.comparisonAvg) * 100;
    }
  });

  //console.log("Processed Data:", groupedData);
  return {
    groupedData,
    metadata: {
      recentStart,
      recentEnd,
      comparisonStart,
      comparisonEnd
    }
  };
};

export const calculateStatisticsAndAnomalies = (groupedData) => {
  const anomalies = [];
  const statistics = [];

  Object.entries(groupedData).forEach(([category, details]) => {
    console.log("Processing category:", category); // Debug log

    if (category === "metadata" || !details.stats) {
      console.warn(`Skipping non-statistical data for category: ${category}`);
      return;
    }

    const { entries, stats } = details;
    if (!stats) {
      console.warn(`Stats missing for category: ${category}`);
      return;
    }

    const { recentAvg, comparisonAvg, recentStdDev, comparisonStdDev, yoyChange } = stats;
    if (Math.abs(recentAvg - comparisonAvg) > comparisonStdDev) {
      anomalies.push({
        category,
        recentAvg,
        comparisonAvg,
        yoyChange,
        deviation: Math.abs(recentAvg - comparisonAvg),
        stdDev: comparisonStdDev,
        entries, // Ensure entries are passed to the anomalies
      });
    }

    statistics.push({
      category,
      entries: entries || [], // Ensure entries is always an array
      recentAvg,
      comparisonAvg,
      yoyChange,
      recentStdDev,
      comparisonStdDev,
    });
  });

  return { anomalies, statistics };
};
