import { Clock, ExternalLink, MapPin } from 'lucide-react';

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
};

export default function StopCard({ stop, className }: StopCardProps) {
  const hasBooking = Boolean(stop.booking_url?.trim());

  return (
    <Card className={cn('overflow-hidden', className)}>
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
