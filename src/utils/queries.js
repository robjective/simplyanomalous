// utils/queries.js
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
        ORDER BY incident_category, supervisor_district, date`
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
  