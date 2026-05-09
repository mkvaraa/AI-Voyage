import { lazy } from 'react';
import Layout from '@/components/Layout';

const HomePage = lazy(() => import('@/pages/HomePage'));
const PlanPage = lazy(() => import('@/pages/PlanPage'));
const RoutePage = lazy(() => import('@/pages/RoutePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'route/:slug', element: <RoutePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
