const WMO_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "rime fog",
  51: "light drizzle",
  53: "moderate drizzle",
  55: "dense drizzle",
  61: "slight rain",
  63: "moderate rain",
  65: "heavy rain",
  71: "slight snow",
  73: "moderate snow",
  75: "heavy snow",
  77: "snow grains",
  80: "rain showers",
  81: "moderate rain showers",
  82: "violent rain showers",
  85: "snow showers",
  86: "heavy snow showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with heavy hail",
};

const WEATHER_CACHE_TTL_MS = 2 * 60 * 1000;

type OpenMeteoPlace = Readonly<{
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  timezone: string;
}>;

type OpenMeteoForecast = Readonly<{
  current: Readonly<{
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weathercode: number;
    windspeed_10m: number;
  }>;
  hourly: Readonly<{
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weathercode: number[];
  }>;
}>;

export type AuthoritativeWeatherAnswer = Readonly<{
  reply: string;
  location: Readonly<{ city: string; state: string | null }>;
  source: Readonly<{ title: string; url: string }>;
  asOf: string;
}>;

type CacheEntry = Readonly<{
  expiresAt: number;
  answer: AuthoritativeWeatherAnswer;
}>;

const answerCache = new Map<string, CacheEntry>();

function normalizedLocation(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function rounded(value: number): string {
  return Math.round(value).toString();
}

function localDateLabel(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

function sourceUrl(place: OpenMeteoPlace): string {
  const query = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: "temperature_2m,apparent_temperature,weathercode,windspeed_10m",
    hourly: "temperature_2m,precipitation_probability,weathercode",
    timezone: place.timezone,
    forecast_days: "3",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
  });
  return `https://api.open-meteo.com/v1/forecast?${query.toString()}`;
}

function forecastDays(forecast: OpenMeteoForecast): Array<{
  label: string;
  low: number;
  high: number;
  rainChance: number;
  condition: string;
}> {
  const currentIndex = Math.max(0, forecast.hourly.time.indexOf(forecast.current.time));
  const groups = new Map<string, number[]>();
  forecast.hourly.time
    .slice(currentIndex, currentIndex + 72)
    .forEach((time, offset) => {
      const index = currentIndex + offset;
      const day = time.slice(0, 10);
      const values = groups.get(day) ?? [];
      values.push(index);
      groups.set(day, values);
    });

  return [...groups.entries()].slice(0, 3).flatMap(([day, indices]) => {
    const temperatures = indices
      .map((index) => forecast.hourly.temperature_2m[index])
      .filter((value): value is number => Number.isFinite(value));
    if (!temperatures.length) return [];
    const rainChance = Math.max(
      0,
      ...indices.map((index) => forecast.hourly.precipitation_probability[index] ?? 0),
    );
    const middle = indices[Math.floor(indices.length / 2)] ?? indices[0]!;
    const condition = WMO_CODES[forecast.hourly.weathercode[middle] ?? 0] ?? "variable conditions";
    return [{
      label: localDateLabel(day),
      low: Math.min(...temperatures),
      high: Math.max(...temperatures),
      rainChance,
      condition,
    }];
  });
}

function buildAnswer(place: OpenMeteoPlace, forecast: OpenMeteoForecast): AuthoritativeWeatherAnswer | null {
  const current = forecast.current;
  if (
    !Number.isFinite(current.temperature_2m) ||
    !Number.isFinite(current.apparent_temperature) ||
    !Number.isFinite(current.windspeed_10m) ||
    !current.time
  ) {
    return null;
  }

  const days = forecastDays(forecast);
  const next24Hours = forecast.hourly.time
    .slice(Math.max(0, forecast.hourly.time.indexOf(current.time)), Math.max(0, forecast.hourly.time.indexOf(current.time)) + 24)
    .map((_, offset) => forecast.hourly.precipitation_probability[Math.max(0, forecast.hourly.time.indexOf(current.time)) + offset] ?? 0);
  const rainChance = Math.max(0, ...next24Hours);
  const rainAdvice = rainChance >= 60
    ? `Rain is likely within the next 24 hours (up to ${rounded(rainChance)}%); bring rain protection.`
    : rainChance >= 30
      ? `Rain is possible within the next 24 hours (up to ${rounded(rainChance)}%); a light rain layer is sensible.`
      : "No material rain chance is shown for the next 24 hours.";
  const locationLabel = `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`;
  const currentCondition = WMO_CODES[current.weathercode] ?? "variable conditions";
  const outlook = days
    .map((day) => `• ${day.label}: ${rounded(day.low)}–${rounded(day.high)}°F, ${day.condition}${day.rainChance >= 30 ? `, up to ${rounded(day.rainChance)}% rain` : ""}.`)
    .join("\n");

  return {
    reply: [
      `Live weather for ${locationLabel} — observed ${current.time} ${place.timezone}:`,
      `• Right now: ${rounded(current.temperature_2m)}°F (feels like ${rounded(current.apparent_temperature)}°F), ${currentCondition}, wind ${rounded(current.windspeed_10m)} mph.`,
      `• ${rainAdvice}`,
      outlook ? "• Three-day outlook:\n" + outlook : "",
      "Source: Open-Meteo live weather data. Conditions can change quickly.",
    ].filter(Boolean).join("\n"),
    location: { city: place.name, state: place.admin1 ?? null },
    source: {
      title: `Open-Meteo live weather for ${locationLabel}`,
      url: sourceUrl(place),
    },
    asOf: `${current.time} ${place.timezone}`,
  };
}

/**
 * Recognizes a request for live conditions without treating general conversation
 * about a hot/cold experience as a weather lookup.
 */
export function isLiveWeatherQuestion(message: string): boolean {
  return /\b(weather|forecast|rain|raining|umbrella|temperature|degrees|snow|snowing|storm|wind|windy|humid|sunny|cloudy|will it rain)\b/i.test(message)
    || /\bwhat\s+(?:should|do)\s+i\s+(?:wear|bring|pack)\b/i.test(message);
}

/**
 * Extracts only a place explicitly supplied in the question. A caller may pass a
 * current-turn/conversation city hint; device coordinates and background location
 * are intentionally out of scope.
 */
export function extractLiveWeatherLocation(
  message: string,
  cityHint?: string | null,
): string | null {
  const patterns = [
    /(?:weather|forecast|rain|temperature|degrees|umbrella|snow|storm|wind|humid|sunny|cloudy)\s+(?:in|for|at|around)\s+([\p{L}\d][\p{L}\d .,'’-]{1,60}?)(?=\s+(?:today|tonight|tomorrow|right now|this week|this weekend)\b|[?.,;!]|$)/iu,
    /(?:in|to|for|at|visiting|going to)\s+([\p{L}\d][\p{L}\d .,'’-]{1,60}?)(?:'s)?\s+weather\b/iu,
    /([\p{L}\d][\p{L}\d .,'’-]{1,60}?)\s+(?:weather|forecast|temperature)\b/iu,
  ];
  for (const pattern of patterns) {
    const matched = message.match(pattern)?.[1]?.trim();
    if (matched) return matched;
  }
  const hint = typeof cityHint === "string" ? cityHint.trim() : "";
  return hint || null;
}

/**
 * Retrieves a single, server-owned live forecast. The cache is keyed only by the
 * public place string and keeps simultaneous client requests aligned for two
 * minutes; it never contains member identity, device location, or conversation.
 */
export async function resolveAuthoritativeWeather(
  location: string,
  fetcher: typeof fetch = fetch,
): Promise<AuthoritativeWeatherAnswer | null> {
  const key = normalizedLocation(location);
  const cached = fetcher === fetch ? answerCache.get(key) : undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.answer;

  try {
    const geocodingResponse = await fetcher(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(5_000) },
    );
    if (!geocodingResponse.ok) return null;
    const geocoding = await geocodingResponse.json() as { results?: OpenMeteoPlace[] };
    const place = geocoding.results?.[0];
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude) || !place.timezone) return null;

    const weatherResponse = await fetcher(sourceUrl(place), {
      signal: AbortSignal.timeout(5_000),
    });
    if (!weatherResponse.ok) return null;
    const forecast = await weatherResponse.json() as OpenMeteoForecast;
    const answer = buildAnswer(place, forecast);
    if (!answer) return null;
    if (fetcher === fetch) {
      answerCache.set(key, { answer, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
    }
    return answer;
  } catch {
    return null;
  }
}
