import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ intersectionData, onDistrictClick }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

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

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Fetch GeoJSON data from ArcGIS REST API
      const geojsonUrl =
        "https://services.arcgis.com/Zs2aNLFN00jrS4gG/ArcGIS/rest/services/Proposed_Final_Map_04_25_22_SHP/FeatureServer/0/query?where=1=1&outFields=*&f=geojson";

      fetch(geojsonUrl)
        .then((response) => response.json())
        .then((data) => {
          L.geoJSON(data, {
            style: feature => ({
              color: "#000000", // Line color for district boundaries
              weight: 1, // Thin line
              fillOpacity: 0.2, // Slight fill opacity for better interaction
            }),
            onEachFeature: (feature, layer) => {
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
                  map.fitBounds(bounds); // Zoom to the clicked district
                  onDistrictClick(feature.properties.district); // Call the callback with the district number
                },
              });
              if (layer.getElement) {
                layer.getElement().style.cursor = "pointer"; // Set cursor for entire layer
              }
            },
          }).addTo(map);
        })
        .catch((error) => console.error("Error loading GeoJSON data:", error));

      mapRef.current = map;
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

  return <div id="map" style={{ height: "500px" }}></div>;
};

export default MapComponent;
