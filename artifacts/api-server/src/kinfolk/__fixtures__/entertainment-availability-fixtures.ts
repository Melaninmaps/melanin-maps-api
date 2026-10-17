import type { EntertainmentProviderResponse } from "../entertainment-availability";

export const BLACK_PANTHER_US_FIXTURE: EntertainmentProviderResponse = {
  status: "available",
  provider: "offline_fixture",
  attribution: {
    label: "Offline fixture — not live availability",
    url: "https://fixture.example/attribution",
  },
  retrievedAt: "2026-10-16T00:00:00.000Z",
  offers: [
    {
      providerId: "disney-plus",
      providerName: "Disney+",
      monetizationType: "flatrate",
      url: "https://fixture.example/watch/black-panther/disney",
    },
    {
      providerId: "store",
      providerName: "Example Store",
      monetizationType: "rent",
      price: 3.99,
      currency: "USD",
      url: "https://fixture.example/watch/black-panther/rent",
    },
  ],
  showtimes: [
    {
      cinemaId: "fixture-cinema",
      cinemaName: "Fixture Cinema",
      startsAt: "2026-10-16T19:30:00.000Z",
      format: "IMAX",
      ticketUrl: "https://fixture.example/tickets/black-panther",
    },
  ],
};

export const PROVIDER_ERROR_FIXTURE: EntertainmentProviderResponse = {
  status: "provider_error",
  provider: "offline_fixture",
  attribution: null,
  retrievedAt: "2026-10-16T00:00:00.000Z",
  offers: [],
  showtimes: [],
};
