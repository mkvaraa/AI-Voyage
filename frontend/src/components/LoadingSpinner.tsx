import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export type LoadingSpinnerProps = {
  message?: string;
  className?: string;
};

export default function LoadingSpinner({
  message = 'Planning your route...',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex min-h-[200px] w-full flex-col items-center justify-center gap-3 py-10 text-muted-foreground',
        className
      )}
    >
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}
