import React from 'react';
import { render } from 'react-dom';
import { MapContainer, TileLayer, GeoJSON, Circle } from 'react-leaflet';

const sampleGeoJson = { 
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { district: '1.0' },
      geometry: {
        type: "Polygon",
        coordinates: [ [ 
          [-122.446, 37.800],
          [-122.446, 37.797],
          [-122.443, 37.797],
          [-122.442, 37.800],
          [-122.446, 37.800]
        ] ]
      }
    },
    {
      type: "Feature",
      properties: { district: '2.0' },
      geometry: {
        type: "Polygon",
        coordinates: [ [ 
          [-122.441, 37.798],
          [-122.441, 37.795],
          [-122.437, 37.795],
          [-122.437, 37.798],
          [-122.441, 37.798]
        ] ]
      }
    }
  ]
};

const style = (feature) => {
  const colors = { '1.0': 'red', '2.0': 'green' };
  return {
    fillColor: colors[feature.properties.district] || 'gray',
    weight: 2,       // Adjust border width
    opacity: 1,       // Fully opaque outline
    color: 'black',  // Black outline for better contrast
    fillOpacity: 0.7  // Adjust fill opacity
  };
};

const circleCenter = [37.798, -122.440];
const circleRadius = 200;

function CrimeDash() {
  return (
    <MapContainer style={{ height: "400px", width: "100%" }} center={[37.797, -122.442]} zoom={14}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <GeoJSON data={sampleGeoJson} style={style} />
      <Circle center={circleCenter} radius={circleRadius} color="red" fillColor="red" fillOpacity={0.5} />
    </MapContainer>
  );
}

render(<CrimeDash />, document.getElementById('map-container'));
