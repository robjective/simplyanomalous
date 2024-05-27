import Papa from "papaparse";

const loadDistrictsData = async () => {
  const response = await fetch("/data/sfdistcts.csv");
  const csvText = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const districts = results.data.map((row) => ({
          name: row.sup_name,
          district: row.sup_dist,
          districtName: row.sup_dist_name,
          districtNum: row.sup_dist_num,
          polygon: JSON.parse(row.polygon), // Assuming the polygon is a JSON string
        }));
        resolve(districts);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};
