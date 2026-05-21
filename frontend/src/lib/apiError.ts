import type { AxiosError } from 'axios';

import type { ErrorResponse } from '@/types/route';

export function formatApiError(error: AxiosError<ErrorResponse> | Error | null): string {
  if (!error) return '';

  if ('isAxiosError' in error && error.isAxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => `${d.loc.join('.')}: ${d.msg}`).join('; ');
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Could not reach the server. Check your connection and try again.';
    }
    return error.message || 'Request failed';
  }

  return error.message || 'Something went wrong';
}
