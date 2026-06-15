import { useParams } from 'react-router';
import { format, parseISO } from 'date-fns';

import ErrorAlert from '@/components/ErrorAlert';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import RouteMap from '@/components/RouteMap';
import ShareButton from '@/components/ShareButton';
import StopCard from '@/components/StopCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useReplaceStop from '@/hooks/useReplaceStop';
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

const formatCreatedAt = (iso: string): string => {
  try {
    return format(parseISO(iso), 'MMMM d, yyyy');
  } catch {
    return iso;
  }
};

export default function RoutePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: route, isPending, isError, error, refetch } = useRoute(slug);
  const {
    mutate: replaceStop,
    variables: replacingVariables,
    isPending: isReplacing,
  } = useReplaceStop(slug);

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
        <LoadingSkeleton variant="route" />
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
    <div className="relative left-1/2 right-1/2 -mx-[50vw] -my-8 w-screen sm:-my-10 lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
      <div className="flex h-full flex-col lg:flex-row">
        <div className="order-2 h-[300px] border-t md:h-[500px] lg:order-1 lg:h-full lg:w-3/5 lg:border-r lg:border-t-0">
          <ErrorBoundary
            fallback={
              <div className="flex h-full items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground">
                The map failed to load. The rest of the route is still available.
              </div>
            }
          >
            <RouteMap days={route.days} />
          </ErrorBoundary>
        </div>

        <div className="order-1 flex flex-col lg:order-2 lg:h-full lg:w-2/5 lg:overflow-y-auto">
          <header className="flex flex-col gap-2 border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-6 sm:py-5 lg:sticky lg:top-0 lg:z-10">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                {route.title}
              </h1>
              {slug && <ShareButton slug={slug} />}
            </div>
            <p className="text-sm text-muted-foreground">
              {route.days.length} {route.days.length === 1 ? 'day' : 'days'} · Estimated{' '}
              {route.currency} {route.total_budget_estimate.toLocaleString()}
            </p>
            {route.created_at && (
              <p className="text-xs text-muted-foreground">
                Generated on {formatCreatedAt(route.created_at)}
              </p>
            )}
          </header>

          <div className="flex flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
            {route.days.map((day) => (
              <DaySection
                key={day.day}
                day={day}
                onReplaceStop={(stopId) => replaceStop({ stop_id: stopId, day: day.day })}
                replacingStopId={
                  isReplacing && replacingVariables?.day === day.day
                    ? replacingVariables.stop_id
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type DaySectionProps = {
  day: Day;
  onReplaceStop: (stopId: string) => void;
  replacingStopId?: string;
};

function DaySection({ day, onReplaceStop, replacingStopId }: DaySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Day {day.day} — {formatDayDate(day.date)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {day.stops.map((stop) => (
          <StopCard
            key={stop.id}
            stop={stop}
            onReplace={() => onReplaceStop(stop.id)}
            isReplacing={replacingStopId === stop.id}
          />
        ))}
      </CardContent>
    </Card>
  );
}
