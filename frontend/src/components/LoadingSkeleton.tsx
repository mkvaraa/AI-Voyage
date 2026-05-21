import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type LoadingSkeletonProps = {
  count?: number;
  className?: string;
};

export default function LoadingSkeleton({ count = 3, className }: LoadingSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading route results"
      className={cn('flex w-full flex-col gap-4', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <RouteCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading route results...</span>
    </div>
  );
}

function RouteCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="size-10 rounded-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
