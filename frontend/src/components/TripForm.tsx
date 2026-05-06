import { useId, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
  type Resolver,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { format, formatISO } from "date-fns";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import * as yup from "yup";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const INTEREST_OPTIONS = [
  { value: "culture", label: "Culture" },
  { value: "food", label: "Food" },
  { value: "nature", label: "Nature" },
  { value: "adventure", label: "Adventure" },
  { value: "shopping", label: "Shopping" },
] as const;

type PresetInterest = (typeof INTEREST_OPTIONS)[number]["value"];

const PRESET_INTERESTS = new Set<string>(INTEREST_OPTIONS.map((o) => o.value));

const MAX_INTERESTS = 10;
const MAX_INTEREST_LENGTH = 40;

const tripSchema = yup.object({
  destination: yup
    .string()
    .trim()
    .required("Destination is required")
    .max(120, "Destination is too long"),
  startDate: yup
    .date()
    .typeError("Pick a start date")
    .required("Start date is required"),
  endDate: yup
    .date()
    .typeError("Pick an end date")
    .required("End date is required")
    .min(yup.ref("startDate"), "End date must be on or after the start date"),
  budget: yup
    .number()
    .typeError("Budget must be a number")
    .required("Budget is required")
    .min(50, "Minimum budget is $50")
    .max(50000, "Maximum budget is $50,000"),
  interests: yup
    .array()
    .of(
      yup
        .string()
        .trim()
        .required()
        .min(1)
        .max(MAX_INTEREST_LENGTH, `Each interest must be ${MAX_INTEREST_LENGTH} characters or fewer`)
    )
    .min(1, "Pick at least one interest")
    .max(MAX_INTERESTS, `You can pick up to ${MAX_INTERESTS} interests`)
    .required("Pick at least one interest"),
});

export type TripFormValues = yup.InferType<typeof tripSchema>;

export type TripPayload = {
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  interests: string[];
};

const toPayload = (values: TripFormValues): TripPayload => ({
  destination: values.destination,
  start_date: formatISO(values.startDate, { representation: "date" }),
  end_date: formatISO(values.endDate, { representation: "date" }),
  budget: values.budget,
  interests: values.interests,
});

const DEFAULT_VALUES: DefaultValues<TripFormValues> = {
  destination: "",
  interests: [],
};

export default function TripForm() {
  const destinationId = useId();
  const budgetId = useId();
  const interestsLabelId = useId();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripFormValues>({
    // @hookform/resolvers v5 infers a stricter Resolver input type than RHF expects;
    // the runtime behavior is correct, so we narrow the type here.
    resolver: yupResolver(tripSchema) as Resolver<TripFormValues>,
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const startDate = useWatch({ control, name: "startDate" });

  const onSubmit = (values: TripFormValues) => {
    const payload = toPayload(values);
    console.log("Trip plan submitted:", payload);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-lg">Plan your trip</CardTitle>
        <CardDescription>
          Tell us where you're heading and what you love — we'll craft the rest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Field
            label="Destination"
            htmlFor={destinationId}
            error={errors.destination?.message}
          >
            <Input
              id={destinationId}
              placeholder="e.g. Lisbon, Portugal"
              autoComplete="off"
              aria-invalid={Boolean(errors.destination)}
              {...register("destination")}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Controller
              control={control}
              name="startDate"
              render={({ field, fieldState }) => (
                <Field label="Start date" error={fieldState.error?.message}>
                  <DateField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Pick start date"
                    invalid={Boolean(fieldState.error)}
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="endDate"
              render={({ field, fieldState }) => (
                <Field label="End date" error={fieldState.error?.message}>
                  <DateField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Pick end date"
                    invalid={Boolean(fieldState.error)}
                    disabled={(date) =>
                      startDate ? date < startDate : false
                    }
                  />
                </Field>
              )}
            />
          </div>

          <Field
            label="Budget"
            htmlFor={budgetId}
            error={errors.budget?.message}
          >
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground">
                $
              </span>
              <Input
                id={budgetId}
                type="number"
                inputMode="numeric"
                min={50}
                max={50000}
                step={50}
                placeholder="1500"
                className="pl-6 pr-12"
                aria-invalid={Boolean(errors.budget)}
                {...register("budget")}
              />
              <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs font-medium text-muted-foreground">
                USD
              </span>
            </div>
          </Field>

          <Controller
            control={control}
            name="interests"
            render={({ field, fieldState }) => (
              <InterestsField
                labelId={interestsLabelId}
                value={field.value ?? []}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Planning...
              </>
            ) : (
              "Plan my trip"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {children}
    </p>
  );
}

function InterestsField({
  labelId,
  value,
  onChange,
  error,
}: {
  labelId: string;
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const customInterests = value.filter((v) => !PRESET_INTERESTS.has(v));
  const atLimit = value.length >= MAX_INTERESTS;

  const togglePreset = (preset: PresetInterest, checked: boolean) => {
    if (checked) {
      if (value.includes(preset)) return;
      if (atLimit) {
        setHint(`You can pick up to ${MAX_INTERESTS} interests`);
        return;
      }
      setHint(null);
      onChange([...value, preset]);
    } else {
      onChange(value.filter((v) => v !== preset));
    }
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_INTEREST_LENGTH) {
      setHint(`Keep it under ${MAX_INTEREST_LENGTH} characters`);
      return;
    }
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setHint("You've already added that interest");
      return;
    }
    if (atLimit) {
      setHint(`You can pick up to ${MAX_INTERESTS} interests`);
      return;
    }
    setHint(null);
    setDraft("");
    onChange([...value, trimmed]);
  };

  const removeCustom = (interest: string) => {
    setHint(null);
    onChange(value.filter((v) => v !== interest));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span id={labelId} className="text-sm font-medium">
          Interests
        </span>
        <span className="text-xs text-muted-foreground">
          {value.length}/{MAX_INTERESTS}
        </span>
      </div>

      <div
        role="group"
        aria-labelledby={labelId}
        aria-invalid={Boolean(error)}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {INTEREST_OPTIONS.map((option) => {
          const checked = value.includes(option.value);
          return (
            <Label
              key={option.value}
              className={cn(
                "cursor-pointer rounded-lg border border-input bg-transparent px-3 py-2 transition-colors hover:bg-muted",
                checked && "border-primary bg-primary/5"
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(state) =>
                  togglePreset(option.value, state === true)
                }
              />
              <span>{option.label}</span>
            </Label>
          );
        })}
      </div>

      {customInterests.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Custom interests">
          {customInterests.map((interest) => (
            <li key={interest}>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 py-1 pl-3 pr-1 text-xs font-medium text-foreground">
                {interest}
                <button
                  type="button"
                  onClick={() => removeCustom(interest)}
                  aria-label={`Remove ${interest}`}
                  className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-1">
        <Label htmlFor={inputId} className="sr-only">
          Add your own interest
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (hint) setHint(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add your own (e.g. nightlife)"
            maxLength={MAX_INTEREST_LENGTH}
            disabled={atLimit}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustom}
            disabled={atLimit || draft.trim().length === 0}
          >
            <Plus />
            Add
          </Button>
        </div>
        {hint ? (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-muted-foreground"
          >
            {hint}
          </p>
        ) : null}
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function DateField({
  value,
  onChange,
  onBlur,
  placeholder,
  invalid,
  disabled,
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  onBlur?: () => void;
  placeholder: string;
  invalid?: boolean;
  disabled?: (date: Date) => boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-invalid={invalid}
          data-empty={!value}
          className="w-full justify-start font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            if (date) setOpen(false);
          }}
          disabled={disabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
