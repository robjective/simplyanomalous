import { parseISO, startOfWeek, isWithinInterval, addWeeks, differenceInWeeks } from "date-fns";
import { calculateDateRanges, formatDateRanges } from "./dateUtils.js";
import { CATEGORY_GROUPS, getCategoryGroup } from "./categoryMappings.js";

export const processData = (data, recentWeeks = 2, longTermWeeks = 52) => {
  const today = new Date();
  const {
    lastCompleteWeekEnd,
    recentStart,
    recentEnd,
    longTermStart,
    longTermEnd,
    previousYearStart,
    previousYearEnd
  } = calculateDateRanges(today, recentWeeks, longTermWeeks);

  const numberOfRecentWeeks = differenceInWeeks(lastCompleteWeekEnd, recentStart);

  const groupedData = {};
  const aggregateData = {
    recentCounts: [],
    longTermCounts: [],
    previousYearCounts: [],
    stats: {
      recentAvg: 0,
      longTermAvg: 0,
      recentStdDev: 0,
      longTermStdDev: 0,
      previousYearAvg: 0,
      yoyChange: 0,
    },
  };

  data.forEach((item) => {
    const { incident_category, year, week, count } = item;
    const safeYear = parseInt(year, 10);
    const safeWeek = parseInt(week, 10);
    const parsedCount = parseInt(count, 10);

    if (isNaN(safeYear) || isNaN(safeWeek) || isNaN(parsedCount)) {
      console.error(
        `Invalid data point skipped: Year: ${year}, Week: ${week}, Count: ${count}`
      );
      return;
    }

    let date = startOfWeek(parseISO(`${safeYear}-W${String(safeWeek).padStart(2, "0")}-1`), { weekStartsOn: 1 });
    if (isNaN(date.getTime()) || date > lastCompleteWeekEnd) {
      console.error(
        `Invalid or future date from parsed data, skipped: Year: ${year}, Week: ${week}`
      );
      return; // Skip this entry
    }

    if (!groupedData[incident_category]) {
      groupedData[incident_category] = {
        entries: [],
        recentCounts: [],
        longTermCounts: [],
        previousYearCounts: [],
        stats: {
          recentAvg: 0,
          longTermAvg: 0,
          recentStdDev: 0,
          longTermStdDev: 0,
          previousYearAvg: 0,
          yoyChange: 0,
        },
      };
    }

    groupedData[incident_category].entries.push({
      date,
      count: parsedCount,
    });

    if (isWithinInterval(date, { start: longTermStart, end: longTermEnd })) {
      groupedData[incident_category].longTermCounts.push(parsedCount);
      aggregateData.longTermCounts.push(parsedCount);
    }

    if (isWithinInterval(date, { start: recentStart, end: lastCompleteWeekEnd })) {
      groupedData[incident_category].recentCounts.push(parsedCount);
      aggregateData.recentCounts.push(parsedCount);
    }

    if (isWithinInterval(date, { start: previousYearStart, end: previousYearEnd })) {
      groupedData[incident_category].previousYearCounts.push(parsedCount);
      aggregateData.previousYearCounts.push(parsedCount);
    }
  });

  // Fill in missing weeks with zero counts for groupedData
  Object.keys(groupedData).forEach((category) => {
    const categoryData = groupedData[category];
    let current = startOfWeek(longTermStart, { weekStartsOn: 1 });

    while (current <= lastCompleteWeekEnd) {
      if (!categoryData.entries.some((entry) => entry.date.getTime() === current.getTime())) {
        categoryData.entries.push({ date: new Date(current), count: 0 });
      }
      current = addWeeks(current, 1);
    }

    // Ensure previous year period is filled with zeros if no data points are present
    let previousYearCurrent = startOfWeek(previousYearStart, { weekStartsOn: 1 });
    while (previousYearCurrent <= previousYearEnd) {
      if (!categoryData.entries.some((entry) => entry.date.getTime() === previousYearCurrent.getTime())) {
        categoryData.entries.push({ date: new Date(previousYearCurrent), count: 0 });
      }
      previousYearCurrent = addWeeks(previousYearCurrent, 1);
    }

    categoryData.entries.sort((a, b) => a.date - b.date);
  });

  // Calculate averages and standard deviations for groupedData
  Object.keys(groupedData).forEach((category) => {
    const { recentCounts, longTermCounts, previousYearCounts } = groupedData[category];
    const calculateStats = (counts) => {
      const average = counts.reduce((sum, val) => sum + val, 0) / counts.length;
      const stdDev = Math.sqrt(
        counts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
          counts.length
      );
      return { average, stdDev };
    };

    if (recentCounts.length > 0) {
      const recentStats = calculateStats(recentCounts);
      groupedData[category].stats.recentAvg = recentStats.average;
      groupedData[category].stats.recentStdDev = recentStats.stdDev;
    }

    if (longTermCounts.length > 0) {
      const longTermStats = calculateStats(longTermCounts);
      groupedData[category].stats.longTermAvg = longTermStats.average;
      groupedData[category].stats.longTermStdDev = longTermStats.stdDev;
    }

    if (previousYearCounts.length > 0) {
      const previousYearStats = calculateStats(previousYearCounts);
      groupedData[category].stats.previousYearAvg = previousYearStats.average;
      groupedData[category].stats.yoyChange = ((groupedData[category].stats.recentAvg - previousYearStats.average) / previousYearStats.average) * 100;
    }
  });

  // Calculate sums, averages and standard deviations for aggregateData
  const calculateStats = (counts) => {
    const sum = counts.reduce((sum, val) => sum + val, 0);
    const average = sum / counts.length;
    const stdDev = Math.sqrt(
      counts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
      counts.length
    );
    return { sum, average, stdDev };
  };

  if (aggregateData.recentCounts.length > 0) {
    const recentStats = calculateStats(aggregateData.recentCounts);
    aggregateData.stats.recentAvg = recentStats.average;
    aggregateData.stats.recentStdDev = recentStats.stdDev;
  }

  if (aggregateData.longTermCounts.length > 0) {
    const longTermStats = calculateStats(aggregateData.longTermCounts);
    aggregateData.stats.longTermAvg = longTermStats.average;
    aggregateData.stats.longTermStdDev = longTermStats.stdDev;
  }

  if (aggregateData.previousYearCounts.length > 0) {
    const previousYearStats = calculateStats(aggregateData.previousYearCounts);
    aggregateData.stats.previousYearAvg = previousYearStats.average;
    aggregateData.stats.yoyChange = ((aggregateData.stats.recentAvg - previousYearStats.average) / previousYearStats.average) * 100;
  }

  const metadata = {
    ...formatDateRanges(
      recentStart,
      lastCompleteWeekEnd,
      longTermStart,
      longTermEnd,
      previousYearStart,
      previousYearEnd
    ),
    numberOfRecentWeeks
  };

  console.log("Processed Data:", groupedData);
  console.log("Aggregate Data:", aggregateData);
  console.log("Metadata:", metadata);

  return { groupedData: { ...groupedData, aggregateData }, metadata: metadata };
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

    const { recentAvg, longTermAvg, recentStdDev, longTermStdDev, previousYearAvg, yoyChange } = stats;

    if (Math.abs(recentAvg - longTermAvg) > longTermStdDev) {
      anomalies.push({
        category,
        recentAvg,
        longTermAvg,
        previousYearAvg,
        yoyChange,
        deviation: Math.abs(recentAvg - longTermAvg),
        stdDev: longTermStdDev,
        entries, // Ensure entries are passed to the anomalies
      });
    }

    statistics.push({
      category,
      entries: entries || [], // Ensure entries is always an array
      recentAvg,
      longTermAvg,
      previousYearAvg,
      yoyChange,
      stdDev: longTermStdDev,
    });
  });

  return { anomalies, statistics };
};
