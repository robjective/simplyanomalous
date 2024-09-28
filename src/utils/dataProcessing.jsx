import { parseISO, isWithinInterval, eachWeekOfInterval, startOfWeek, formatISO } from "date-fns";
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
    const { incident_description, date, count } = item;

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

    const categoryGroup = getCategoryGroup(incident_description);
    if (!groupedData[categoryGroup]) {
      groupedData[categoryGroup] = initializeCategoryData();
    }
    if (!groupedData[incident_description]) {
      groupedData[incident_description] = initializeCategoryData();
    }

    // Get the start of the week for the date
    const weekStart = startOfWeek(parsedDate, { weekStartsOn: 1 }); // Assuming week starts on Monday
    const weekKey = formatISO(weekStart, { representation: 'date' });

    // Aggregate counts per week
    groupedData[categoryGroup].entries[weekKey] = (groupedData[categoryGroup].entries[weekKey] || 0) + parsedCount;
    groupedData[incident_description].entries[weekKey] = (groupedData[incident_description].entries[weekKey] || 0) + parsedCount;
  });

  // Determine the overall date range in weeks
  const overallStartDate = startOfWeek(new Date(Math.min(comparisonStart, recentStart)), { weekStartsOn: 1 });
  const overallEndDate = startOfWeek(new Date(Math.max(comparisonEnd, recentEnd)), { weekStartsOn: 1 });

  
  // Fill in missing weeks with 0s for all categories
  const fillMissingWeeks = (categoryData, startDate, endDate) => {
    const allWeeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
    allWeeks.forEach(date => {
      const weekKey = formatISO(date, { representation: 'date' });
      if (!categoryData.entries[weekKey]) {
        categoryData.entries[weekKey] = 0;
      }
    });
  };

  // Convert aggregated entries back to array format, populate counts, and fill missing weeks
  Object.keys(groupedData).forEach(category => {
    if (category === "metadata") return;

    const entriesMap = groupedData[category].entries;

    // Fill missing weeks for the entire range
    fillMissingWeeks(groupedData[category], overallStartDate, overallEndDate);

    // Convert entriesMap to entries array and sort by date
    groupedData[category].entries = Object.entries(entriesMap)
      .map(([date, count]) => ({
        date: new Date(date),
        count
      }))
      .sort((a, b) => a.date - b.date); // Sort entries by date

    // Populate counts for statistical calculations
    console.log(category, recentStart, recentEnd);
    

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

  // Calculate the number of recent weeks
  const recentWeeks = groupedData[Object.keys(groupedData)[0]]?.recentCounts.length || 0;

  return {
    groupedData,
    metadata: {
      recentStart,
      recentEnd,
      comparisonStart,
      comparisonEnd,
      recentWeeks,
      overallStartDate,
      overallEndDate,
    },
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

    // Calculate if the category is out of bounds (deviation > 1/2 sigma)
    const outOfBounds = 
    Math.abs(recentAvg - comparisonAvg) > (comparisonStdDev * 1.5) &&
    recentAvg >= 1 &&
    comparisonAvg >= 1;

    // Store anomalies 
    anomalies.push({
      category,
      recentAvg,
      comparisonAvg,
      yoyChange,
      deviation: Math.abs(recentAvg - comparisonAvg),
      comparisonStdDev,
      entries,
      outOfBounds, // Add the outOfBounds field
    });

    // Store statistics for each category
    statistics.push({
      category,
      entries: entries || [],
      recentAvg,
      comparisonAvg,
      yoyChange,
      recentStdDev,
      comparisonStdDev,
      outOfBounds, // Include in the statistics array too
    });
  });

  return { anomalies, statistics };
};

