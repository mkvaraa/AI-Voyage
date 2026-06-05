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

  const queryKey = ['route', slug] as const;

  return useMutation<
    RouteResponseWithSlug,
    AxiosError<ErrorResponse>,
    ReplaceStopVariables,
    { previousData: RouteResponseWithSlug | undefined }
  >({
    mutationFn: async (variables) => {
      const response = await api.patch<RouteResponseWithSlug>(
        `/api/route/${slug}/replace`,
        variables
      );
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<RouteResponseWithSlug>(queryKey);

      if (previousData) {
        queryClient.setQueryData<RouteResponseWithSlug>(queryKey, {
          ...previousData,
          days: previousData.days.map((day) =>
            day.day === variables.day
              ? {
                  ...day,
                  stops: day.stops.map((stop) =>
                    stop.id === variables.stop_id
                      ? { ...stop, name: 'Finding alternative...', type: 'loading' }
                      : stop
                  ),
                }
              : day
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export default useReplaceStop;
