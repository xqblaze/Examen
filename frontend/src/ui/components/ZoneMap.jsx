import React from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';

const DEFAULT_CENTER = [55.751244, 37.618423];

function latLngsToGeoJson(latlngs) {
  const coords = latlngs[0].map((p) => [p.lng, p.lat]);
  if (coords.length > 0) coords.push(coords[0]);
  return {
    type: 'Polygon',
    coordinates: [coords]
  };
}

export function ZoneMap({ zones, onCreatePolygon, readOnly }) {
  const [center] = React.useState(DEFAULT_CENTER);

  return (
    <MapContainer center={center} zoom={12} style={{ height: 420, width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {zones?.map((z) => {
        const poly = z.polygon;
        if (!poly?.coordinates?.[0]?.length) return null;
        const latlng = poly.coordinates[0].map(([lng, lat]) => [lat, lng]);
        return <Polygon key={z.id} positions={latlng} pathOptions={{ color: '#6ea8fe' }} />;
      })}

      <FeatureGroup>
        {!readOnly ? (
          <EditControl
            position="topright"
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              polyline: false,
              marker: false
            }}
            edit={{ edit: false, remove: false }}
            onCreated={(e) => {
              if (e.layerType === 'polygon') {
                const geo = latLngsToGeoJson(e.layer.getLatLngs());
                onCreatePolygon?.(geo);
              }
            }}
          />
        ) : null}
      </FeatureGroup>
    </MapContainer>
  );
}

