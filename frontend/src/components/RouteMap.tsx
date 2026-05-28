import 'mapbox-gl/dist/mapbox-gl.css';

import { useEffect, useMemo, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Map, { Layer, Marker, Popup, Source, useMap } from 'react-map-gl';
import type { FeatureCollection, LineString } from 'geojson';

import { Badge } from '@/components/ui/badge';
import { useWeather } from '@/hooks/useWeather';
import type { Day, Stop } from '@/types/route';

function WeatherBadge({ lat, lng }: { lat: number; lng: number }) {
  const { data, isLoading, isError } = useWeather(lat, lng);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (isError || !data) return null;

  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://openweathermap.org/img/wn/${data.icon}.png`}
        alt={data.description}
        className="h-6 w-6"
        width={24}
        height={24}
      />
      <span className="text-xs font-bold">{Math.round(data.temp)}°C</span>
      <span className="text-xs capitalize text-gray-500">{data.description}</span>
    </div>
  );
}

const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

if (token) {
  mapboxgl.accessToken = token;
}

interface RouteMapProps {
  days: Day[];
}

const ROME_LAT = 41.9;
const ROME_LNG = 12.5;

type PinCategory = 'food' | 'hotel' | 'attraction';

const categoryForType = (type: Stop['type']): PinCategory => {
  switch (type) {
    case 'restaurant':
    case 'food':
      return 'food';
    case 'hotel':
      return 'hotel';
    default:
      return 'attraction';
  }
};

const pinClassForCategory: Record<PinCategory, string> = {
  food: 'bg-orange-500 ring-orange-200',
  hotel: 'bg-green-500 ring-green-200',
  attraction: 'bg-blue-500 ring-blue-200',
};

const categoryLabel: Record<PinCategory, string> = {
  food: 'Food & drink',
  hotel: 'Hotel',
  attraction: 'Attraction',
};

const pinClassForType = (type: Stop['type']): string => pinClassForCategory[categoryForType(type)];

function FitBoundsToStops({ stops }: { stops: Stop[] }) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map || stops.length === 0) return;

    if (stops.length === 1) {
      map.flyTo({ center: [stops[0].lng, stops[0].lat], zoom: 13, duration: 1000 });
      return;
    }

    let minLat = stops[0].lat;
    let maxLat = stops[0].lat;
    let minLng = stops[0].lng;
    let maxLng = stops[0].lng;
    for (const s of stops) {
      if (s.lat < minLat) minLat = s.lat;
      if (s.lat > maxLat) maxLat = s.lat;
      if (s.lng < minLng) minLng = s.lng;
      if (s.lng > maxLng) maxLng = s.lng;
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 60, duration: 1000 }
    );
  }, [map, stops]);

  return null;
}

export default function RouteMap({ days }: RouteMapProps) {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const stops = useMemo<Stop[]>(() => days.flatMap((day) => day.stops), [days]);

  const routeGeoJson = useMemo<FeatureCollection<LineString> | null>(() => {
    if (stops.length < 2) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: stops.map((s) => [s.lng, s.lat]),
          },
        },
      ],
    };
  }, [stops]);

  const presentCategories = useMemo<PinCategory[]>(() => {
    const order: PinCategory[] = ['attraction', 'food', 'hotel'];
    const present = new Set(stops.map((s) => categoryForType(s.type)));
    return order.filter((c) => present.has(c));
  }, [stops]);

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

  const initial = stops[0];

  return (
    <div className="relative" style={{ width: '100%', height: 500 }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          latitude: initial?.lat ?? ROME_LAT,
          longitude: initial?.lng ?? ROME_LNG,
          zoom: 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        <FitBoundsToStops stops={stops} />

        {routeGeoJson && (
          <Source id="route-line" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-line-layer"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#6366f1',
                'line-width': 3,
                'line-opacity': 0.8,
                'line-dasharray': [2, 1],
              }}
            />
          </Source>
        )}

        {stops.map((stop) => (
          <Marker
            key={stop.id}
            latitude={stop.lat}
            longitude={stop.lng}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedStop(stop);
            }}
          >
            <div
              title={stop.name}
              className={`h-4 w-4 cursor-pointer rounded-full ring-2 ring-offset-1 ring-offset-white shadow ${pinClassForType(
                stop.type
              )}`}
            />
          </Marker>
        ))}

        {selectedStop && (
          <Popup
            latitude={selectedStop.lat}
            longitude={selectedStop.lng}
            anchor="bottom"
            offset={16}
            closeOnClick={false}
            onClose={() => setSelectedStop(null)}
          >
            <div className="flex max-w-[200px] flex-col gap-1.5 p-1">
              <h3 className="text-sm font-bold leading-tight">{selectedStop.name}</h3>
              <div>
                <Badge variant="secondary" className="capitalize">
                  {selectedStop.type}
                </Badge>
              </div>
              <p className="text-xs text-foreground">{selectedStop.duration_minutes} min</p>
              {selectedStop.notes && <p className="text-xs text-gray-500">{selectedStop.notes}</p>}
              <WeatherBadge lat={selectedStop.lat} lng={selectedStop.lng} />
              {selectedStop.booking_url && (
                <a
                  href={selectedStop.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline hover:text-blue-700"
                >
                  Book now
                </a>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {presentCategories.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md border bg-white/90 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
          <div className="mb-1 font-semibold text-gray-700">Legend</div>
          <ul className="flex flex-col gap-1">
            {presentCategories.map((category) => (
              <li key={category} className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ring-2 ring-offset-1 ring-offset-white ${pinClassForCategory[category]}`}
                />
                <span className="text-gray-700">{categoryLabel[category]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
