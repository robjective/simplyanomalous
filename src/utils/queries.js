export const getCategoryComparisonQuery = (startDateRecent, endDateRecent, startDateComparison, endDateComparison, district) => {
  const getDaysBetween = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const differenceInTime = endDate.getTime() - startDate.getTime();
    return differenceInTime / (1000 * 3600 * 24) + 1; // Adding 1 to include both start and end date
  };

  const daysRecent = getDaysBetween(startDateRecent, endDateRecent);
  const daysComparison = getDaysBetween(startDateComparison, endDateComparison);

  let whereClauseRecent = `report_datetime >= '${startDateRecent.toISOString().replace('Z', '')}' AND report_datetime <= '${endDateRecent.toISOString().replace('Z', '')}'`;
  let whereClauseComparison = `report_datetime >= '${startDateComparison.toISOString().replace('Z', '')}' AND report_datetime <= '${endDateComparison.toISOString().replace('Z', '')}'`;
  
  if (district) {
    whereClauseRecent += ` AND supervisor_district = '${district}'`;
    whereClauseComparison += ` AND supervisor_district = '${district}'`;
  }
  return {
    endpoint: "wg3w-h783.json",
    query: `
      SELECT 
        supervisor_district, incident_category,
        CASE 
          WHEN incident_category IN ('Assault', 'Homicide', 'Rape','Robbery') THEN 'Violent Crime'
          WHEN incident_category IN ('Burglary', 'Malicious Mischief', 'Embezzlement',  'Larceny Theft', 'Stolen Property', 'Vandalism', 'Motor Vehicle Theft', 'Arson') THEN 'Property Crime'
          ELSE 'Other Crime'
        END AS category_group,
        SUM(CASE 
          WHEN ${whereClauseRecent} THEN 1 
          ELSE 0 
        END) AS total_count_recent,
        SUM(CASE 
          WHEN ${whereClauseComparison} THEN 1 
          ELSE 0 
        END) AS total_count_comparison,
        SUM(CASE 
          WHEN ${whereClauseRecent} THEN 1 
          ELSE 0 
        END) / ${daysRecent} AS daily_average_recent,
        SUM(CASE 
          WHEN ${whereClauseComparison} THEN 1 
          ELSE 0 
        END) / ${daysComparison} AS daily_average_comparison,
        CASE
          WHEN ${whereClauseRecent} THEN 'Recent Period'
          WHEN ${whereClauseComparison} THEN 'Comparison Period'
        END AS period
      WHERE (${whereClauseRecent}) OR (${whereClauseComparison})
      GROUP BY incident_category, supervisor_district, category_group, period
      ORDER BY supervisor_district, category_group, incident_category, period`
  };
};


export const getSupervisorQuery = () => ({
    endpoint: "cqbw-m5m3.json",
    query: `SELECT sup_dist_num, sup_name, multipolygon WHERE sup_dist_num IS NOT NULL`
  });
  
  export const getIncidentQuery = (startDateRecent, endDateRecent, startDateComparison, endDateComparison, district) => {
    let whereClauseRecent = `report_datetime >= '${startDateRecent.toISOString().replace('Z', '')}' AND report_datetime <= '${endDateRecent.toISOString().replace('Z', '')}'`;
    let whereClauseComparison = `report_datetime >= '${startDateComparison.toISOString().replace('Z', '')}' AND report_datetime <= '${endDateComparison.toISOString().replace('Z', '')}'`;
  
    if (district) {
      whereClauseRecent += ` AND supervisor_district = '${district}'`;
      whereClauseComparison += ` AND supervisor_district = '${district}'`;
    }
  
    return {
      endpoint: "wg3w-h783.json",
      query: `
        SELECT incident_category, supervisor_district, date_trunc_ymd(report_datetime) AS date, COUNT(*) AS count 
        WHERE (${whereClauseRecent}) OR (${whereClauseComparison})
        GROUP BY incident_category, supervisor_district, date 
        ORDER BY date`
    };
  };
  
  export const getAnomalyQuery = (fromDate, toDate, category) => {
    const whereClause = `report_datetime >= '${fromDate}' AND report_datetime <= '${toDate}' AND incident_category = '${category}'`;
  
    return {
      endpoint: "wg3w-h783.json",
      query: `
        SELECT Intersection, COUNT(*) as count
        WHERE ${whereClause}
        GROUP BY Intersection
        ORDER BY count DESC`
    };
  };
  
  export const getEmployeeSalaryQuery = (employeeName) => ({
    endpoint: "employee_compensation.json", // Adjust the endpoint if necessary
    query: `
        SELECT 
            employee_identifier,
            job,
            organization_group,
            department,
            union,
            salary,
            other_salaries,
            total_salary,
            benefits,
            total_compensation,
            year
        WHERE 
            employee_identifier = '${employeeName}' AND 
            year_type = 'Calendar'
        ORDER BY year ASC`
});
