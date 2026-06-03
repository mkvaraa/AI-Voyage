import { useParams } from 'react-router';
import { format, parseISO } from 'date-fns';

import ErrorAlert from '@/components/ErrorAlert';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import RouteMap from '@/components/RouteMap';
import ShareButton from '@/components/ShareButton';
import StopCard from '@/components/StopCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useRoute from '@/hooks/useRoute';
import { formatApiError } from '@/lib/apiError';
import type { Day } from '@/types/route';

const formatDayDate = (iso: string): string => {
  try {
    return format(parseISO(iso), 'MMMM d');
  } catch {
    return iso;
  }
};

export default function RoutePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: route, isPending, isError, error, refetch } = useRoute(slug);

  if (!slug) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <ErrorAlert title="Missing route" message="No route slug was provided in the URL." />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !route) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <ErrorAlert
          title="Couldn't load this route"
          message={formatApiError(error) || 'The route may have expired or been removed.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{route.title}</h1>
          {slug && <ShareButton slug={slug} />}
        </div>
        <p className="text-sm text-muted-foreground">
          {route.days.length} {route.days.length === 1 ? 'day' : 'days'} · Estimated{' '}
          {route.currency} {route.total_budget_estimate.toLocaleString()}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {route.days.map((day) => (
          <DaySection key={day.day} day={day} />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <RouteMap days={route.days} />
      </div>
    </div>
  );
}

function DaySection({ day }: { day: Day }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Day {day.day} — {formatDayDate(day.date)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {day.stops.map((stop) => (
          <StopCard key={stop.id} stop={stop} />
        ))}
      </CardContent>
    </Card>
  );
}
