import {
  parseISO,
  subDays,
  endOfWeek,
  subWeeks,
  isWithinInterval,
  format,
  startOfWeek,
  addWeeks,
} from "date-fns";

export const calculateDateRanges = (today, recentWeeks = 2, longTermWeeks = 52) => {
  const lastCompleteWeekEnd = endOfWeek(subWeeks(today, 1));
  const recentStart = subWeeks(lastCompleteWeekEnd, recentWeeks);
  const recentEnd = subDays(lastCompleteWeekEnd, 1); // Day before the start of the recent period
  const longTermEnd = subDays(recentStart, 1); // Day before the start of the recent period
  const longTermStart = subWeeks(longTermEnd, longTermWeeks);

  const previousYearStart = subWeeks(recentStart, 52);
  const previousYearEnd = subWeeks(lastCompleteWeekEnd, 52);

  return {
    lastCompleteWeekEnd,
    recentStart,
    recentEnd,
    longTermStart,
    longTermEnd,
    previousYearStart,
    previousYearEnd
  };
};

export const formatDateRanges = (recentStart, lastCompleteWeekEnd, longTermStart, longTermEnd, previousYearStart, previousYearEnd) => {
  const dateFormat = "MM/dd/yyyy";
  const formattedRecentStart = format(recentStart, dateFormat);
  const formattedRecentEnd = format(lastCompleteWeekEnd, dateFormat);
  const formattedRecentStartLong = format(recentStart, "MMMM d");
  const formattedRecentEndLong = format(lastCompleteWeekEnd, "MMMM d");

  const formattedLongTermStart = format(longTermStart, dateFormat);
  const formattedLongTermEnd = format(longTermEnd, dateFormat);
  const formattedLongTermStartLong = format(longTermStart, "MMMM d");
  const formattedLongTermEndLong = format(longTermEnd, "MMMM d");

  const formattedPreviousYearStartLong = format(previousYearStart, "MMMM d");
  const formattedPreviousYearEndLong = format(previousYearEnd, "MMMM d");

  return {
    recentPeriod: `${formattedRecentStart} to ${formattedRecentEnd}`,
    recentPeriodLong: `${formattedRecentStartLong} to ${formattedRecentEndLong}`,
    longTermPeriod: `${formattedLongTermStart} to ${formattedLongTermEnd}`,
    longTermPeriodLong: `${formattedLongTermStartLong} to ${formattedLongTermEndLong}`,
    previousYearPeriodLong: `${formattedPreviousYearStartLong} to ${formattedPreviousYearEndLong}`,
  };
};
