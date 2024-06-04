import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { processCrimeData } from './utils/crimeDataProcessing';
import 'leaflet/dist/leaflet.css';
import './CrimeDash.css';

function CrimeDash({ data, metadata, districtData }) {
  console.log("CrimeDash data", data);
  const [percentDifferences, setPercentDifferences] = useState({});
  const mapRef = useRef(null);

  useEffect(() => {
    if (data && metadata) {
      const { recentStart, recentEnd, comparisonStart, comparisonEnd } = metadata;
      const differences = processCrimeData(data, recentStart, recentEnd, comparisonStart, comparisonEnd);
      setPercentDifferences(differences);
      console.log('differences', differences);
    } else {
      console.error('Invalid data or metadata');
      }
  }, [data, metadata]);

  const style = (feature, category) => {
    const district = feature.properties.district;
    const difference = percentDifferences[category] && percentDifferences[category][district]
      ? percentDifferences[category][district].percentChange || 0
      : 0;
    const color = difference > 0
      ? `rgba(255, 0, 0, ${Math.min(difference / 100, 1)})`
      : `rgba(0, 255, 0, ${Math.min(-difference / 100, 1)})`;

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
};
      };

  const onEachFeature = (feature, layer, category) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7,
    });

        layer.bindPopup(`<strong>District: ${feature.properties.district}</strong><br>Change: ${percentDifferences[category] && percentDifferences[category][feature.properties.district]
          ? percentDifferences[category][feature.properties.district].percentChange || 0
          : 0}%`).openPopup();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style(feature, category));
        layer.closePopup();
      },
  });
};

  return (
    <div>
      <h2>Crime Dashboard</h2>
      {districtData && Object.keys(percentDifferences).length > 0 && Object.keys(percentDifferences).map((category) => (
        <div key={category}>
          <h3>{category}</h3>
          <MapContainer ref={mapRef} style={{ height: "500px", width: "100%" }} center={[37.7749, -122.4194]} zoom={12}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <GeoJSON
              data={districtData}
              style={(feature) => style(feature, category)}
              onEachFeature={(feature, layer) => onEachFeature(feature, layer, category)}
            />
          </MapContainer>
        </div>
      ))}
    </div>
  );
  }

export default CrimeDash;
