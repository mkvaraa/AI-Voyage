import * as yup from 'yup';

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const MIN_BUDGET = 50;
export const MAX_BUDGET = 50000;

export const tripSchema = yup.object({
  destination: yup
    .string()
    .trim()
    .required('Destination is required')
    .min(2, 'Destination must be at least 2 characters'),

  start_date: yup
    .date()
    .typeError('Start date is required')
    .required('Start date is required')
    .test(
      'not-in-past',
      'Start date must be today or in the future',
      (value) => !value || startOfDay(value).getTime() >= startOfDay(new Date()).getTime()
    ),

  end_date: yup
    .date()
    .typeError('End date is required')
    .required('End date is required')
    .test('after-start', 'End date must be after the start date', function (value) {
      const start = this.parent.start_date as Date | undefined;
      if (!value || !start) return true;
      return value.getTime() > start.getTime();
    }),

  budget: yup
    .number()
    .typeError('Budget is required')
    .required('Budget is required')
    .min(MIN_BUDGET, `Budget must be at least $${MIN_BUDGET}`)
    .max(MAX_BUDGET, `Budget cannot exceed $${MAX_BUDGET.toLocaleString()}`),

  interests: yup
    .array()
    .of(yup.string().trim().required())
    .min(1, 'Select at least one interest')
    .required('Select at least one interest'),
});

export type TripFormValues = yup.InferType<typeof tripSchema>;
