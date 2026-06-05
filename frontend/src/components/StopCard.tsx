import { Clock, ExternalLink, Loader2, MapPin, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Stop, StopType } from '@/types/route';

const TYPE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  landmark: 'default',
  attraction: 'default',
  museum: 'secondary',
  food: 'secondary',
  restaurant: 'secondary',
  nature: 'outline',
  shopping: 'outline',
  entertainment: 'secondary',
  transport: 'outline',
  hotel: 'outline',
};

const typeVariant = (type: StopType) => TYPE_VARIANT[type as string] ?? 'secondary';

function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—';
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

const formatTypeLabel = (type: string) =>
  type.length > 0 ? type[0].toUpperCase() + type.slice(1) : type;

export type StopCardProps = {
  stop: Stop;
  className?: string;
  onReplace?: () => void;
  isReplacing?: boolean;
};

export default function StopCard({ stop, className, onReplace, isReplacing }: StopCardProps) {
  if (stop.type === 'loading') {
    return (
      <Card
        className={cn('group relative overflow-hidden', className)}
        aria-busy="true"
        aria-live="polite"
      >
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex animate-pulse flex-col gap-3">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded-full bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
          </div>
          <span className="sr-only">{stop.name || 'Finding alternative...'}</span>
        </CardContent>
      </Card>
    );
  }

  const hasBooking = Boolean(stop.booking_url?.trim());

  return (
    <Card className={cn('group relative overflow-hidden', className)}>
      {isReplacing ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          aria-live="polite"
        >
          <Loader2 aria-hidden="true" className="size-5 animate-spin text-muted-foreground" />
          <span className="sr-only">Replacing stop…</span>
        </div>
      ) : null}
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold leading-tight">{stop.name}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={typeVariant(stop.type)} className="capitalize">
                {formatTypeLabel(stop.type)}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {formatDuration(stop.duration_minutes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden="true" className="size-3.5" />
                {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
              </span>
            </div>
          </div>
          {onReplace ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReplace}
              disabled={isReplacing}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Replace ${stop.name}`}
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Replace
            </Button>
          ) : null}
        </div>

        {stop.notes ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{stop.notes}</p>
        ) : null}

        {hasBooking ? (
          <div>
            <Button asChild variant="outline" size="sm">
              <a
                href={stop.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open booking page for ${stop.name} in a new tab`}
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                Book / Learn more
              </a>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
