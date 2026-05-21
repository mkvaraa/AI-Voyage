export type StopType =
  | 'landmark'
  | 'museum'
  | 'food'
  | 'restaurant'
  | 'nature'
  | 'shopping'
  | 'entertainment'
  | 'transport'
  | 'hotel'
  | 'attraction'
  | (string & {});

export type Stop = {
  id: string;
  name: string;
  type: StopType;
  lat: number;
  lng: number;
  duration_minutes: number;
  notes: string;
  booking_url: string;
};

export type Day = {
  day: number;
  date: string;
  stops: Stop[];
};

export type RouteResponse = {
  title: string;
  days: Day[];
  total_budget_estimate: number;
  currency: string;
};

export type RouteResponseWithSlug = RouteResponse & { slug: string };

export type TripRequest = {
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  interests: string[];
};

export type ValidationErrorItem = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type ErrorResponse = {
  detail: string | ValidationErrorItem[];
};
