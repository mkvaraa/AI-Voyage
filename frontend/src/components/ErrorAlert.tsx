import { AlertCircle, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export type ErrorAlertProps = {
  message: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export default function ErrorAlert({
  message,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Retry',
  className,
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={cn('pr-2', className)}>
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      {onRetry ? (
        <AlertAction>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw aria-hidden="true" className="size-3.5" />
            {retryLabel}
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}
