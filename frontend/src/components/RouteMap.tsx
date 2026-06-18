import 'mapbox-gl/dist/mapbox-gl.css';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Map, { Layer, Marker, Popup, Source, useMap } from 'react-map-gl';
import type { FeatureCollection, LineString } from 'geojson';

import LoadingSkeleton from '@/components/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeather } from '@/hooks/useWeather';
import type { Day, Stop } from '@/types/route';

function WeatherBadge({ lat, lng }: { lat: number; lng: number }) {
  const { data, isLoading, isError } = useWeather(lat, lng);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-3 w-16" />
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

type PinCategory = 'food' | 'hotel' | 'airport' | 'attraction';

const isAirportStop = (stop: Pick<Stop, 'type' | 'name'>): boolean => {
  if (stop.type === 'airport' || stop.type === 'transport') return true;
  return /airport|aeropuerto|aéroport|flughafen/i.test(stop.name);
};

const categoryForStop = (stop: Pick<Stop, 'type' | 'name'>): PinCategory => {
  if (isAirportStop(stop)) return 'airport';
  switch (stop.type) {
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
  airport: 'bg-purple-500 ring-purple-200',
  attraction: 'bg-blue-500 ring-blue-200',
};

const categoryLabel: Record<PinCategory, string> = {
  food: 'Food & drink',
  hotel: 'Hotel',
  airport: 'Airport',
  attraction: 'Attraction',
};

const pinClassForStop = (stop: Pick<Stop, 'type' | 'name'>): string =>
  pinClassForCategory[categoryForStop(stop)];

type Bounds = [[number, number], [number, number]];

const boundsEqual = (a: Bounds | null, b: Bounds | null): boolean => {
  if (!a || !b) return false;
  return a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1];
};

function FitBoundsToStops({ stops }: { stops: Stop[] }) {
  const { current: map } = useMap();
  const prevBoundsRef = useRef<Bounds | null>(null);

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

    const nextBounds: Bounds = [
      [minLng, minLat],
      [maxLng, maxLat],
    ];

    if (boundsEqual(prevBoundsRef.current, nextBounds)) return;
    prevBoundsRef.current = nextBounds;

    map.fitBounds(nextBounds, { padding: 60, duration: 1000 });
  }, [map, stops]);

  return null;
}

function RouteMap({ days }: RouteMapProps) {
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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
    const order: PinCategory[] = ['attraction', 'food', 'hotel', 'airport'];
    const present = new Set(stops.map((s) => categoryForStop(s)));
    return order.filter((c) => present.has(c));
  }, [stops]);

  if (!token) {
    return (
      <div
        style={{ width: '100%', height: '100%', minHeight: 500 }}
        className="flex items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground"
      >
        Map unavailable: VITE_MAPBOX_TOKEN is not set.
      </div>
    );
  }

  const initial = stops[0];

  return (
    <div className="relative h-full min-h-[500px] w-full">
      <Map
        mapboxAccessToken={token}
        initialViewState={{
          latitude: initial?.lat ?? ROME_LAT,
          longitude: initial?.lng ?? ROME_LNG,
          zoom: 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={() => setMapLoaded(true)}
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
              className={`h-4 w-4 cursor-pointer rounded-full ring-2 ring-offset-1 ring-offset-white shadow ${pinClassForStop(
                stop
              )}`}
            />
          </Marker>
        ))}

        {selectedStop && (
          <Popup
            latitude={selectedStop.lat}
            longitude={selectedStop.lng}
            anchor="bottom"
            offset={20}
            closeOnClick={false}
            onClose={() => setSelectedStop(null)}
            maxWidth="320px"
            className="ai-voyage-popup"
          >
            <div className="flex w-[280px] flex-col gap-2 p-4">
              <div className="flex items-start gap-2 pr-6">
                <h3 className="text-base font-semibold leading-tight tracking-tight">
                  {selectedStop.name}
                </h3>
              </div>
              <div>
                <Badge variant="secondary" className="capitalize">
                  {selectedStop.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{selectedStop.duration_minutes} min</p>
              {selectedStop.notes && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {selectedStop.notes}
                </p>
              )}
              <WeatherBadge lat={selectedStop.lat} lng={selectedStop.lng} />
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {selectedStop.booking_url && (
                  <a
                    href={selectedStop.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Book now
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedStop.lat},${selectedStop.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Google Maps
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {!mapLoaded && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <LoadingSkeleton variant="map" className="h-full" />
        </div>
      )}

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

export default memo(RouteMap);
