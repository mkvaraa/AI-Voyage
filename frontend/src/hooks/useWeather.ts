import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { WeatherData } from '@/types/weather';

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY as string | undefined;

const ONE_CALL_URL = 'https://api.openweathermap.org/data/3.0/onecall';
const CURRENT_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  if (!API_KEY) {
    throw new Error('Missing VITE_OPENWEATHER_KEY environment variable');
  }

  try {
    const { data } = await axios.get(ONE_CALL_URL, {
      params: {
        lat,
        lon: lng,
        appid: API_KEY,
        units: 'metric',
        exclude: 'minutely,hourly,alerts',
      },
    });

    const current = data.current;
    const weather = current?.weather?.[0];

    return {
      temp: current.temp,
      description: weather?.description ?? '',
      icon: weather?.icon ?? '',
      humidity: current.humidity,
    };
  } catch (err) {
    // Fallback to free tier 2.5 endpoint if One Call 3.0 requires a subscription.
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
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
    throw err;
  }
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
