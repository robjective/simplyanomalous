// utils/csvUtils.js
import Papa from 'papaparse';

export const fetchDistrictShapesFromCSV = async (csvFilePath) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFilePath, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          console.log("CSV Data:", results.data); // Log CSV data
          resolve(results.data);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

const convertMultipolygonToGeoJSON = (multipolygon) => {
  // Convert MULTIPOLYGON string to GeoJSON format
  const coordinates = multipolygon
    .replace("MULTIPOLYGON (((", "[[[[")
    .replace(/\)\), \(\(/g, "]], [[")
    .replace(/\), \(/g, "], [")
    .replace(/\)\)/g, "]]]")
    .replace(/(\d)-(\d)/g, "$1, $2"); // Handle coordinates with negative values
  return JSON.parse(coordinates);
};

export const parsePolygonToGeoJSON = (shapes) => {
  return shapes.map(shape => {
    try {
      const coordinates = convertMultipolygonToGeoJSON(shape.polygon);
      return {
        type: "Feature",
        properties: {
          sup_name: shape.sup_name,
          sup_dist_num: shape.sup_dist_num
        },
        geometry: {
          type: "MultiPolygon",
          coordinates
        }
      };
    } catch (error) {
      console.error("Error parsing polygon:", shape.polygon, error);
      return null;
    }
  }).filter(shape => shape !== null);
};
