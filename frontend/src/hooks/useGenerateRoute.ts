import { api } from '@/lib/axios';
import type { ErrorResponse, RouteResponseWithSlug, TripRequest } from '@/types/route';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

const generateRoute = async (data: TripRequest): Promise<RouteResponseWithSlug> => {
  const response = await api.post<RouteResponseWithSlug>('/api/route', data);
  return response.data;
};

const useGenerateRoute = () => {
  return useMutation<RouteResponseWithSlug, AxiosError<ErrorResponse>, TripRequest>({
    mutationFn: generateRoute,
  });
};

export default useGenerateRoute;
