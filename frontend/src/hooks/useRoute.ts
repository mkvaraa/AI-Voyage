import { api } from '@/lib/axios';
import mockRoute from '@/mocks/route-response.json';
import type { ErrorResponse, RouteResponseWithSlug } from '@/types/route';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const fetchRoute = async (slug: string): Promise<RouteResponseWithSlug> => {
  if (USE_MOCK) {
    return { ...(mockRoute as Omit<RouteResponseWithSlug, 'slug'>), slug };
  }
  const response = await api.get<RouteResponseWithSlug>(`/api/route/${slug}`);
  return response.data;
};

const useRoute = (slug: string | undefined) => {
  return useQuery<RouteResponseWithSlug, AxiosError<ErrorResponse>>({
    queryKey: ['route', slug],
    queryFn: () => fetchRoute(slug as string),
    enabled: Boolean(slug),
    retry: USE_MOCK ? false : 2,
  });
};

export default useRoute;
