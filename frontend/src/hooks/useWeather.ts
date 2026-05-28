import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { WeatherData } from '@/types/weather';

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY as string | undefined;

const CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error('Missing VITE_OPENWEATHER_KEY environment variable');
  }

  const { data } = await axios.get(CURRENT_URL, {
    params: {
      lat,
      lon: lng,
      appid: API_KEY,
      units: 'metric',
    },
  });

  const weather = data.weather?.[0];

  return {
    temp: data.main.temp,
    description: weather?.description ?? '',
    icon: weather?.icon ?? '',
    humidity: data.main.humidity,
  };
}

export function useWeather(lat: number, lng: number) {
  const enabled =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  return useQuery<WeatherData>({
    queryKey: ['weather', lat, lng],
    queryFn: () => fetchWeather(lat, lng),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}
