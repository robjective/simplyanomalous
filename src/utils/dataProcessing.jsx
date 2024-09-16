import { parseISO, isWithinInterval, eachDayOfInterval, formatISO } from "date-fns";
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

  // Fill in missing dates with 0s for all categories
  const fillMissingDates = (categoryData, startDate, endDate) => {
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    allDates.forEach(date => {
      const dateKey = formatISO(date, { representation: 'date' });
      if (!categoryData.entries[dateKey]) {
        categoryData.entries[dateKey] = 0;
      }
    });
  };

  // Convert aggregated entries back to array format, populate counts, and fill missing dates
  Object.keys(groupedData).forEach(category => {
    if (category === "metadata") return;

    const entriesMap = groupedData[category].entries;
    fillMissingDates(groupedData[category], comparisonStart, comparisonEnd);
    fillMissingDates(groupedData[category], recentStart, recentEnd);

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
    }

    if (comparisonCounts.length > 0) {
      const comparisonStats = calculateStats(comparisonCounts);
      groupedData[category].stats.comparisonAvg = comparisonStats.average;
      groupedData[category].stats.comparisonStdDev = comparisonStats.stdDev;
    }

    if (groupedData[category].stats.recentAvg > 0 && groupedData[category].stats.comparisonAvg > 0) {
      groupedData[category].stats.yoyChange = ((groupedData[category].stats.recentAvg - groupedData[category].stats.comparisonAvg) / groupedData[category].stats.comparisonAvg) * 100;
    }
  });

  // Calculate the number of recent days
  const recentStartDate = new Date(recentStart);
  const recentEndDate = new Date(recentEnd);
  const timeDifference = recentEndDate - recentStartDate;
  const recentDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  return {
    groupedData,
    metadata: {
      recentStart,
      recentEnd,
      comparisonStart,
      comparisonEnd,
      recentDays
    }
  };
};

export const calculateStatisticsAndAnomalies = (groupedData) => {
  const anomalies = [];
  const statistics = [];

  Object.entries(groupedData).forEach(([category, details]) => {
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
        entries,
      });
    }

    statistics.push({
      category,
      entries: entries || [],
      recentAvg,
      comparisonAvg,
      yoyChange,
      recentStdDev,
      comparisonStdDev,
    });
  });

  return { anomalies, statistics };
};
