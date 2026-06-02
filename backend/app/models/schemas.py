from datetime import date

from pydantic import BaseModel, Field, model_validator


class TripRequest(BaseModel):
    destination: str = Field(min_length=2)
    start_date: date
    end_date: date
    budget: float = Field(ge=50, le=50000)
    interests: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class Stop(BaseModel):
    id: str
    name: str
    type: str
    lat: float
    lng: float
    duration_minutes: int
    notes: str
    booking_url: str


class Day(BaseModel):
    day: int
    date: date
    stops: list[Stop]


class RouteResponse(BaseModel):
    title: str
    days: list[Day]
    total_budget_estimate: float
    currency: str = "USD"
    slug: str | None = None
