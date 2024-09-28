// utils/api.js
export const fetchDataFromAPI = async (queryObject, updateLoadingCount, updateProgress) => {
  const baseUrl = "https://data.sfgov.org/resource/";
  let allData = [];
  let limit = 1000; // Set the limit for each request
  let offset = 0; // Initialize offset
  let hasMoreData = true;

  const { endpoint, query } = queryObject;
  if (!endpoint || !query) {
    console.error("Invalid query object:", queryObject);
    return null; // Handle invalid query object
  }

  while (hasMoreData) {
    const url = new URL(baseUrl + endpoint);
    const fullQuery = `${query} LIMIT ${limit} OFFSET ${offset}`;
    url.searchParams.append("$query", fullQuery);

    console.log("URL being requested:", url.href); // Debug output

    try {
      if (updateLoadingCount) updateLoadingCount(1); // Increment loading count
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      allData = allData.concat(data);

      // Call updateProgress with the current total rows
      if (updateProgress) updateProgress(allData.length);

      if (data.length < limit) {
        hasMoreData = false; // Stop if the data received is less than the limit
      } else {
        offset += limit; // Increase offset for the next batch
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return null; // Return null or appropriate error handling
    } finally {
      if (updateLoadingCount) updateLoadingCount(-1); // Decrement loading count
    }
  }

  return allData;
};
