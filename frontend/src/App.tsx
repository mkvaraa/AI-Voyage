import { QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { routes } from '@/routes';

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
