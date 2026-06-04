import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { api } from '@/lib/axios';
import type { ErrorResponse, RouteResponseWithSlug } from '@/types/route';

export type ReplaceStopVariables = {
  stop_id: string;
  day: number;
  preferences?: string;
};

const useReplaceStop = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation<RouteResponseWithSlug, AxiosError<ErrorResponse>, ReplaceStopVariables>({
    mutationFn: async (variables) => {
      const response = await api.patch<RouteResponseWithSlug>(
        `/api/route/${slug}/replace`,
        variables,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route', slug] });
    },
  });
};

export default useReplaceStop;
