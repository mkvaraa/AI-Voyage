import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';
import Map from 'react-map-gl';

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

if (token) {
  mapboxgl.accessToken = token;
}

interface RouteMapProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
}

const ROME_LAT = 41.9;
const ROME_LNG = 12.5;

export default function RouteMap({
  latitude = ROME_LAT,
  longitude = ROME_LNG,
  zoom = 12,
}: RouteMapProps) {
  if (!token) {
    return (
      <div
        style={{ width: '100%', height: 500 }}
        className="flex items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground"
      >
        Map unavailable: VITE_MAPBOX_TOKEN is not set.
      </div>
    );
  }

  return (
    <Map
      mapboxAccessToken={token}
      initialViewState={{ latitude, longitude, zoom }}
      style={{ width: '100%', height: 500 }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    />
  );
}
