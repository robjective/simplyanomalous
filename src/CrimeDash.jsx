import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import './CrimeDash.css';

function CrimeDash({ data, metadata, districtData }) {
  const [percentDifferences, setPercentDifferences] = useState({});
  const [incidentCategoryChanges, setIncidentCategoryChanges] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0 && metadata && typeof metadata === 'object') {
      const processedData = processCrimeData(data);
      setPercentDifferences(processedData.categoryGroupDifferences);
      setIncidentCategoryChanges(processedData.incidentCategoryChanges);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [data, metadata]);

  const processCrimeData = (data) => {
    const categoryGroupDifferences = {};
    const incidentCategoryChanges = {
      'Violent Crime': [],
      'Property Crime': [],
      'Other Crime': []
    };
  
    data.forEach((item) => {
      const { supervisor_district, category_group, incident_category, total_count_recent, total_count_comparison, period } = item;
  
      const district = supervisor_district ? parseInt(supervisor_district, 10) : 'district_undefined';
  
      if (!category_group) return;
  
      if (!categoryGroupDifferences[category_group]) categoryGroupDifferences[category_group] = {};
      if (!categoryGroupDifferences[category_group][district]) categoryGroupDifferences[category_group][district] = { recent: 0, comparison: 0 };
  
      if (period === "Recent Period") {
        categoryGroupDifferences[category_group][district].recent += parseFloat(total_count_recent);
      } else if (period === "Comparison Period") {
        categoryGroupDifferences[category_group][district].comparison += parseFloat(total_count_comparison);
      }
  
      if (!incidentCategoryChanges[category_group]) {
        incidentCategoryChanges[category_group] = [];
      }
  
      const existingCategory = incidentCategoryChanges[category_group].find(item => item.category === incident_category);
      if (existingCategory) {
        if (period === "Recent Period") {
          existingCategory.recent += parseFloat(total_count_recent);
        } else if (period === "Comparison Period") {
          existingCategory.comparison += parseFloat(total_count_comparison);
        }
      } else {
        incidentCategoryChanges[category_group].push({
          category: incident_category,
          recent: period === "Recent Period" ? parseFloat(total_count_recent) : 0,
          comparison: period === "Comparison Period" ? parseFloat(total_count_comparison) : 0,
        });
      }
    });
  
    for (const categoryGroup in categoryGroupDifferences) {
      let citywideRecent = 0;
      let citywideComparison = 0;
  
      for (const district in categoryGroupDifferences[categoryGroup]) {
        const recent = categoryGroupDifferences[categoryGroup][district].recent || 0;
        const comparison = categoryGroupDifferences[categoryGroup][district].comparison || 0;
        citywideRecent += recent;
        citywideComparison += comparison;
      }
  
      categoryGroupDifferences[categoryGroup][-1] = {
        recent: citywideRecent,
        comparison: citywideComparison,
        percentChange: citywideComparison !== 0 ? ((citywideRecent - citywideComparison) / citywideComparison) * 100 : (citywideRecent > 0 ? 100 : -100),
      };
    }
  
    for (const categoryGroup in categoryGroupDifferences) {
      for (const district in categoryGroupDifferences[categoryGroup]) {
        const recent = categoryGroupDifferences[categoryGroup][district].recent || 0;
        const comparison = categoryGroupDifferences[categoryGroup][district].comparison || 0;
        let percentChange = 0;
  
        if (comparison !== 0) {
          percentChange = ((recent - comparison) / comparison) * 100;
        } else if (recent !== 0) {
          percentChange = recent > comparison ? 100 : -100;
        }
  
        categoryGroupDifferences[categoryGroup][district].percentChange = percentChange;
      }
    }
  
    for (const categoryGroup in incidentCategoryChanges) {
      incidentCategoryChanges[categoryGroup].forEach((category) => {
        category.percentChange = category.comparison !== 0 ? ((category.recent - category.comparison) / category.comparison) * 100 : (category.recent > 0 ? 100 : -100);
      });
      incidentCategoryChanges[categoryGroup].sort((a, b) => a.percentChange - b.percentChange);
    }
    console.log("metadata", metadata);
    return { categoryGroupDifferences, incidentCategoryChanges };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { month: 'short', day: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatNumber = (number) => {
    if (typeof number !== 'number') return 'N/A';
    return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const getCitywideStyle = (category) => {
    const citywideData = percentDifferences[category] && percentDifferences[category][-1];
    const difference = citywideData ? citywideData.percentChange : 0;
    const color = difference > 0 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)';
    //return {
    //  backgroundColor: color,
    //  padding: '10px'
    //};
    return {
      backgroundColor: 'rgba(255,255,255,255)',
      padding: '10px'
    };
  };

  const style = (feature, category) => {
    const district = parseInt(feature.properties.district, 10);

    const categoryData = percentDifferences[category];

    if (!categoryData || !categoryData[district]) {
      return { fillColor: 'gray', fillOpacity: 0.5, className: 'crime-district' };
    }

    const difference = categoryData[district].percentChange || 0;

    const normalizedDifference = Math.max(-100, Math.min(100, difference));
    const alpha = Math.abs(normalizedDifference) / 100;
    const adjustedAlpha = alpha === 0 ? 0.1 : alpha;

    const color = normalizedDifference > 0
      ? `rgba(255, 0, 0, ${adjustedAlpha})`
      : `rgba(0, 255, 0, ${adjustedAlpha})`;

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7,
      className: 'crime-district'
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

        // Add popup information
        const district = parseInt(feature.properties.district, 10);
        const percentChange = percentDifferences[category] && percentDifferences[category][district]
          ? percentDifferences[category][district].percentChange
          : 0;

        // Show only on hover
        layer.bindPopup(`<strong>District: ${district}</strong><br>Change: ${percentChange.toFixed(1)}%`).openPopup();
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(style(feature, category));
        layer.closePopup();
      },
      click: (e) => {
        // Handle navigation on click
        const districtId = feature.properties.district;
        const supervisorName = feature.properties.supervisor ? feature.properties.supervisor.replace(/\s+/g, "-").toLowerCase() : 'unknown-supervisor'; // Assuming supervisor data exists in properties
        navigate(`/${supervisorName}/district/${districtId}`);
      },
    });
  };

  const getRowStyle = (percentChange) => {
    const normalizedDifference = Math.max(-100, Math.min(100, percentChange));
    const alpha = Math.abs(normalizedDifference) / 100;
    const adjustedAlpha = alpha === 0 ? 0.1 : alpha;
    const color = normalizedDifference > 0
      ? `rgba(255, 0, 0, ${adjustedAlpha})`
      : `rgba(0, 255, 0, ${adjustedAlpha})`;
    return { backgroundColor: color };
  };

  const getSubtitle = (category) => {
    const citywideData = percentDifferences[category] && percentDifferences[category][-1];
    const recentCount = citywideData ? citywideData.recent : 'N/A';
    const comparisonCount = citywideData ? citywideData.comparison : 'N/A';
    const percentChange = citywideData ? citywideData.percentChange.toFixed(1) : 'N/A';
    const recentStart = metadata && metadata.recentStart ? formatDate(metadata.recentStart) : 'N/A';
    const recentEnd = metadata && metadata.recentEnd ? formatDate(metadata.recentEnd) : 'N/A';
    const comparisonStart = metadata && metadata.comparisonStart ? formatDate(metadata.comparisonStart) : 'N/A';
    const comparisonEnd = metadata && metadata.comparisonEnd ? formatDate(metadata.comparisonEnd) : 'N/A'; 
    return `Last year, between ${comparisonStart} and ${comparisonEnd} there were ${formatNumber(comparisonCount)} incidents of ${category}, but this year over the same period ${recentStart} and ${recentEnd} there were ${formatNumber(recentCount)}, a ${percentChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(percentChange)}%.`;
  };
  

  const renderIncidentCategoryTable = (categoryGroup) => {
    const totals = incidentCategoryChanges[categoryGroup].reduce((acc, item) => {
      acc.recent += item.recent;
      acc.comparison += item.comparison;
      return acc;
    }, { recent: 0, comparison: 0 });

    totals.percentChange = totals.comparison !== 0 ? ((totals.recent - totals.comparison) / totals.comparison) * 100 : (totals.recent > 0 ? 100 : -100);

    return (
      <div>
        <div className="crime-header">{categoryGroup} Changes By Category</div>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Category</th>
              <th style={{ textAlign: 'right' }}>Total (Comparison Period)</th>
              <th style={{ textAlign: 'right' }}>Total (Recent Period)</th>
              <th style={{ textAlign: 'right' }}>Percent Change</th>
            </tr>
          </thead>
          <tbody>
            {incidentCategoryChanges[categoryGroup].map((category) => {
              const { category: incidentCategory, recent, comparison, percentChange } = category;
              return (
                <tr key={incidentCategory} style={getRowStyle(percentChange)}>
                  <td style={{ textAlign: 'left' }}>{incidentCategory}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(comparison)}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(recent)}</td>
                  <td style={{ textAlign: 'right' }}>{percentChange.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr style={getRowStyle(totals.percentChange)}>
              <td style={{ textAlign: 'left' }}><strong>Totals</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{formatNumber(totals.comparison)}</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{formatNumber(totals.recent)}</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{totals.percentChange.toFixed(1)}%</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="map-grid">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          districtData &&
          Object.keys(percentDifferences).length > 0 &&
          ["Violent Crime", "Property Crime", "Other Crime"].map((category) => {
            // Determine if the data is citywide or district-specific
            // Assuming -1 represents citywide data
            const districtKey = -1; // Change this value based on your data context
            const displayDistrict = districtKey === -1 ? 'citywide' : `district ${districtKey}`;

            let percentChange = percentDifferences[category][districtKey]?.percentChange || 0;
            const direction = percentChange > 0 ? 'Up' : 'Down';
            percentChange = Math.round(Math.abs(percentChange));

            return (
              <div className="map-item" key={category} style={getCitywideStyle(category)}>
              <h3 className="crime-header">
                {`San Francisco ${category} ${direction} ${percentChange}%`}
              </h3>
              {/* Subheader with date comparison */}
              <p className="crime-subheader">
                {`${formatDate(metadata.recentStart)} to ${formatDate(metadata.recentEnd)} vs the same period last year`}
              </p>
                {/* Map */}
                <MapContainer
                  ref={mapRef}
                  style={{ height: "300px", width: "100%" }}
                  center={[37.7749, -122.4194]}
                  zoom={12}
                  scrollWheelZoom={false} // Disable scroll wheel zoom
                  touchZoom={false}       // Disable touch zooming
                  dragging={false}        // Disable map dragging
                >
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
                {/* Detailed Subtitle */}
                <p style={{ fontSize: '0.8em', margin: '5px 0', textAlign: 'left' }}>
                  {getSubtitle(category)}
                </p>
                
                {/* Incident Category Table */}
                {renderIncidentCategoryTable(category)}
                {/* Attribution Link */}
                <div style={{ textAlign: 'right', marginTop: '5px', fontSize: '0.8em' }}>
                  <a href="https://data.sfgov.org" target="_blank" rel="noopener noreferrer">
                    all data from the SF open data portal
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CrimeDash;
