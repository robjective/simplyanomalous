import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchDataFromAPI } from "./utils/api";
import { getSupervisorQuery } from "./utils/queries";

const MapComponent = ({ intersectionData, onDistrictClick }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDistrictData = async () => {
    setIsLoading(true);
    const queryObject = getSupervisorQuery();

    try {
      const data = await fetchDataFromAPI(queryObject);
      const geoJsonData = {
        type: "FeatureCollection",
        features: data.map((item) => {
          let geometry;
          try {
            geometry = item.multipolygon;
          } catch (error) {
            console.error("Error parsing multipolygon:", error, item.multipolygon);
            return null;
          }
          return {
            type: "Feature",
            properties: {
              district: item.sup_dist_num,
              supervisor: item.sup_name,
            },
            geometry,
          };
        }).filter(feature => feature !== null),
      };

      if (mapRef.current) {
        L.geoJSON(geoJsonData, {
          style: (feature) => ({
            color: "#000000", // Line color for district boundaries
            weight: 1, // Thin line
            fillOpacity: 0.2, // Slight fill opacity for better interaction
          }),
          onEachFeature: (feature, layer) => {
            layer.bindPopup(`
              <div>
                <strong>District:</strong> ${feature.properties.district}<br>
                <strong>Supervisor:</strong> ${feature.properties.supervisor}
              </div>
            `);
            layer.on({
              mouseover: (e) => {
                e.target.setStyle({
                  fillColor: "#000000",
                  fillOpacity: 0.3, // Increase opacity on hover
                });
              },
              mouseout: (e) => {
                e.target.setStyle({
                  fillOpacity: 0.2, // Reset fill opacity
                });
              },
              click: (e) => {
                console.log("Feature clicked:", feature.properties);
                const bounds = layer.getBounds();
                mapRef.current.fitBounds(bounds); // Zoom to the clicked district
                onDistrictClick(feature.properties.district); // Call the callback with the district number
              },
            });
            if (layer.getElement) {
              const element = layer.getElement();
              if (element) {
                element.style.cursor = "pointer"; // Set cursor for entire layer
              }
            }
          },
        }).addTo(mapRef.current);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading district data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current) {
      const mapContainer = document.getElementById("map");
      if (!mapContainer) {
        console.error("Map container not found");
        return;
      }

      const map = L.map(mapContainer, {
        center: [37.7749, -122.4194], // Center of San Francisco
        zoom: 12,
        scrollWheelZoom: false, // Disable scroll zoom
      });

      // Use a tile layer with minimal labels
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        noWrap: true,
      }).addTo(map);

      mapRef.current = map;

      fetchDistrictData();
    }
  }, [onDistrictClick]);

  useEffect(() => {
    if (mapRef.current && intersectionData && intersectionData.length > 0) {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers
      intersectionData.forEach(({ Intersection, count }) => {
        const [street1, street2] = Intersection.split(" \\ ");
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(street1 + " & " + street2 + ", San Francisco")}`;

        fetch(geocodeUrl)
          .then((response) => response.json())
          .then((data) => {
            if (data && data.length > 0) {
              const { lat, lon } = data[0];
              const marker = L.marker([lat, lon])
                .addTo(mapRef.current)
                .bindPopup(`<b>${Intersection}</b><br>Count: ${count}`)
                .on("click", () => {
                  console.log(`Marker for ${Intersection} clicked.`);
                });
              markersRef.current.push(marker);
            }
          })
          .catch((error) =>
            console.error("Error fetching geocode data:", error),
          );
      });
    }
  }, [intersectionData]);

  return (
    <div>
      {isLoading && <div>Loading district data...</div>}
      <div id="map" style={{ height: "500px" }}></div>
    </div>
  );
};

export default MapComponent;
