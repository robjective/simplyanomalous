import { parseISO, isWithinInterval, eachDayOfInterval, formatISO } from 'date-fns';
import { getCategoryGroup } from './categoryMappings';

const fillMissingDates = (data, startDate, endDate) => {
  const filledData = { ...data };
  eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
    const dateStr = formatISO(date, { representation: 'date' });
    if (!filledData[dateStr]) {
      filledData[dateStr] = 0;
    }
  });
  return filledData;
};

const calculateAverage = (data, days) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  return total / days;
};

const processData = (data, recentStart, recentEnd, comparisonStart, comparisonEnd) => {
  const groupedData = {};

  const initializeCategoryData = () => ({
    entries: {},
    recentCounts: [],
    comparisonCounts: [],
    stats: {
      recentAvg: 0,
      comparisonAvg: 0,
      recentTotal: 0,
      comparisonTotal: 0,
      yoyChange: 0,
    },
  });

  if (typeof data !== 'object' || data === null) {
    console.error('Data is not an object:', data);
    return groupedData;
  }

  console.log('Raw data:', data);

  Object.keys(data).forEach(category => {
    Object.keys(data[category]).forEach(district => {
      const districtDataArray = Array.isArray(data[category][district]) ? data[category][district] : [];
      
      if (!Array.isArray(districtDataArray)) {
        console.error('District data is not an array:', district, data[category][district]);
        return;
      }

      districtDataArray.forEach(item => {
        const { incident_category, date, count, supervisor_district } = item;

        if (!incident_category || !date || !count || !supervisor_district) {
          console.warn('Missing required fields in item:', item);
          return;
        }

        const parsedDate = parseISO(date);
        if (isNaN(parsedDate.getTime())) {
          console.warn('Invalid date format:', date);
          return;
        }

        const parsedCount = parseInt(count, 10);
        if (isNaN(parsedCount)) {
          console.warn('Invalid count value:', count);
          return;
        }

        const categoryGroup = getCategoryGroup(incident_category);
        if (!groupedData[categoryGroup]) groupedData[categoryGroup] = {};
        if (!groupedData[categoryGroup][supervisor_district]) {
          groupedData[categoryGroup][supervisor_district] = initializeCategoryData();
        }

        const dateKey = formatISO(parsedDate, { representation: 'date' });
        groupedData[categoryGroup][supervisor_district].entries[dateKey] =
          (groupedData[categoryGroup][supervisor_district].entries[dateKey] || 0) + parsedCount;

        if (isWithinInterval(parsedDate, { start: recentStart, end: recentEnd })) {
          groupedData[categoryGroup][supervisor_district].recentCounts.push(parsedCount);
        }
        if (isWithinInterval(parsedDate, { start: comparisonStart, end: comparisonEnd })) {
          groupedData[categoryGroup][supervisor_district].comparisonCounts.push(parsedCount);
        }
      });
    });
  });

  Object.keys(groupedData).forEach(category => {
    Object.keys(groupedData[category]).forEach(district => {
      const districtData = groupedData[category][district];

      const recentTotal = districtData.recentCounts.reduce((sum, count) => sum + count, 0);
      const comparisonTotal = districtData.comparisonCounts.reduce((sum, count) => sum + count, 0);

      districtData.stats.recentTotal = recentTotal;
      districtData.stats.comparisonTotal = comparisonTotal;

      const recentDays = (recentEnd - recentStart) / (1000 * 60 * 60 * 24) + 1;
      const comparisonDays = (comparisonEnd - comparisonStart) / (1000 * 60 * 60 * 24) + 1;

      districtData.stats.recentAvg = calculateAverage(districtData.recentCounts, recentDays);
      districtData.stats.comparisonAvg = calculateAverage(districtData.comparisonCounts, comparisonDays);

      if (districtData.stats.recentAvg > 0 && districtData.stats.comparisonAvg > 0) {
        districtData.stats.yoyChange =
          ((districtData.stats.recentAvg - districtData.stats.comparisonAvg) / districtData.stats.comparisonAvg) * 100;
      }
    });
  });

  console.log('Final grouped data with statistics:', groupedData);

  return groupedData;
};

const calculateDifferences = (groupedData, recentStartDate, recentEndDate, comparisonStartDate, comparisonEndDate) => {
  const differences = {};

  Object.keys(groupedData).forEach(category => {
    differences[category] = {};

    Object.keys(groupedData[category]).forEach(district => {
      const districtData = groupedData[category][district];

      const totalDelta = districtData.stats.recentTotal - districtData.stats.comparisonTotal;
      const averageDelta = districtData.stats.recentAvg - districtData.stats.comparisonAvg;

      differences[category][district] = {
        totalDelta,
        averageDelta,
        percentChange: districtData.stats.yoyChange,
      };

      console.log(`Differences for category ${category}, district ${district}:`, differences[category][district]);
    });
  });

  return differences;
};

export const processCrimeData = (rawData, recentStartDate, recentEndDate, comparisonStartDate, comparisonEndDate) => {
  if (typeof rawData !== 'object' || rawData === null) {
    console.error('Raw data is not an object:', rawData);
    return {};
  }

  const groupedData = processData(rawData, recentStartDate, recentEndDate, comparisonStartDate, comparisonEndDate);

  return calculateDifferences(groupedData, recentStartDate, recentEndDate, comparisonStartDate, comparisonEndDate);
};
