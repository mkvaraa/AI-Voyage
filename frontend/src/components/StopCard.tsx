import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Clock, ExternalLink, MapPin, RefreshCw, X } from 'lucide-react';

import LoadingSkeleton from '@/components/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  onReplace?: (preferences?: string) => void;
  isReplacing?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
};

export default function StopCard({
  stop,
  className,
  onReplace,
  isReplacing,
  onSelect,
  isSelected,
}: StopCardProps) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [preferences, setPreferences] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isPromptOpen) {
      inputRef.current?.focus();
    }
  }, [isPromptOpen]);

  useEffect(() => {
    if (isReplacing) {
      setIsPromptOpen(false);
      setPreferences('');
    }
  }, [isReplacing]);

  if (stop.type === 'loading' || isReplacing) {
    return <LoadingSkeleton variant="stop" className={className} />;
  }

  const hasBooking = Boolean(stop.booking_url?.trim());

  const openPrompt = () => {
    setPreferences('');
    setIsPromptOpen(true);
  };

  const closePrompt = () => {
    setIsPromptOpen(false);
    setPreferences('');
  };

  const submitPrompt = () => {
    const trimmed = preferences.trim();
    onReplace?.(trimmed.length > 0 ? trimmed : undefined);
  };

  const isInteractive = Boolean(onSelect) && !isPromptOpen;

  const handleCardClick = () => {
    if (!isInteractive) return;
    onSelect?.();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all',
        isInteractive && 'cursor-pointer hover:border-primary/40 hover:shadow-md',
        isSelected && 'border-primary ring-2 ring-primary/30',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? `Show ${stop.name} on map` : undefined}
      aria-pressed={isInteractive ? Boolean(isSelected) : undefined}
    >
      <CardContent
        className={cn(
          'flex flex-col gap-2 p-3 transition-[filter] duration-200 sm:gap-3 sm:p-4',
          isPromptOpen && 'pointer-events-none blur-sm select-none'
        )}
        aria-hidden={isPromptOpen}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold leading-tight sm:text-base">{stop.name}</h3>
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
              onClick={(event) => {
                event.stopPropagation();
                openPrompt();
              }}
              disabled={isReplacing || isPromptOpen}
              className="opacity-100 transition-opacity focus-visible:opacity-100 xl:opacity-0 xl:group-hover:opacity-100"
              aria-label={`Replace ${stop.name}`}
            >
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Replace
            </Button>
          ) : null}
        </div>

        {stop.notes ? (
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{stop.notes}</p>
        ) : null}

        {hasBooking ? (
          <div>
            <Button asChild variant="outline" size="sm">
              <a
                href={stop.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                aria-label={`Open booking page for ${stop.name} in a new tab`}
              >
                <ExternalLink aria-hidden="true" className="size-3.5" />
                Book / Learn more
              </a>
            </Button>
          </div>
        ) : null}
      </CardContent>

      {isPromptOpen ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 p-3 backdrop-blur-sm sm:p-4 animate-in fade-in-0 duration-150"
          role="dialog"
          aria-modal="true"
          aria-label={`Replace ${stop.name}`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitPrompt();
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`replace-preferences-${stop.id}`}
                className="text-xs font-medium text-foreground sm:text-sm"
              >
                Replace this stop
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={closePrompt}
                aria-label="Cancel replace"
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </div>
            <Input
              id={`replace-preferences-${stop.id}`}
              ref={inputRef}
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closePrompt();
                }
              }}
              placeholder="Any preferences? e.g. quieter, cheaper, vegan… (optional)"
              maxLength={200}
              autoComplete="off"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">Leave empty to let us pick.</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={closePrompt}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  <RefreshCw aria-hidden="true" className="size-3.5" />
                  Replace
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </Card>
  );
}
