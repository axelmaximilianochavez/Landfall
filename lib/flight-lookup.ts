/**
 * Flight lookup via AeroDataBox (RapidAPI).
 *
 * The key comes from EXPO_PUBLIC_AERODATABOX_KEY, which Expo inlines into the
 * bundle — so it ships readable to anyone who downloads the app. Acceptable
 * while developing; before release this call belongs behind a server that
 * holds the key. See .env.example.
 */

const HOST = 'aerodatabox.p.rapidapi.com';

/** Only the parts of the payload we use. */
type ApiTime = { utc?: string; local?: string };
type ApiAirport = {
  iata?: string;
  icao?: string;
  name?: string;
  shortName?: string;
  municipalityName?: string;
  countryCode?: string;
  timeZone?: string;
  location?: { lat?: number; lon?: number };
};
type ApiEnd = {
  airport?: ApiAirport;
  scheduledTime?: ApiTime;
  revisedTime?: ApiTime;
  predictedTime?: ApiTime;
  terminal?: string;
  gate?: string;
  checkInDesk?: string;
  baggageBelt?: string;
};
export type ApiFlight = {
  number?: string;
  status?: string;
  departure?: ApiEnd;
  arrival?: ApiEnd;
  aircraft?: { model?: string; reg?: string };
  airline?: { name?: string; iata?: string };
  greatCircleDistance?: { km?: number };
  lastUpdatedUtc?: string;
};

/** One flight leg, flattened into what the form and the detail screen need. */
export type FlightInfo = {
  number: string;
  airline: string | null;
  aircraft: string | null;
  distanceKm: number | null;
  status: string | null;

  fromIata: string | null;
  fromName: string | null;
  fromCity: string | null;
  fromCountry: string | null;
  fromTerminal: string | null;
  fromGate: string | null;
  fromLat: number | null;
  fromLon: number | null;
  /** Local wall-clock at the airport, 'YYYY-MM-DD' and 'HH:MM'. */
  departDate: string | null;
  departTime: string | null;

  toIata: string | null;
  toName: string | null;
  toCity: string | null;
  toCountry: string | null;
  toTerminal: string | null;
  toGate: string | null;
  toLat: number | null;
  toLon: number | null;
  arriveDate: string | null;
  arriveTime: string | null;

  /**
   * Live revisions, kept apart from the scheduled times above.
   *
   * The plan is built on the schedule; a revised or predicted time is what is
   * happening today. Folding them together would make the itinerary's own
   * duration drift every time the flight is delayed.
   */
  departRevisedTime: string | null;
  arriveRevisedTime: string | null;

  /** Minutes in the air on the schedule, from UTC so timezones cannot skew it. */
  durationMinutes: number | null;
  checkedAt: string;
};

/** '2026-09-10 08:20+09:00' -> { date: '2026-09-10', time: '08:20' } */
function splitLocal(value?: string): { date: string | null; time: string | null } {
  if (!value) return { date: null, time: null };
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return match ? { date: match[1], time: match[2] } : { date: null, time: null };
}

/** '2026-09-09 23:20Z' -> epoch ms, or null. */
function utcMs(value?: string): number | null {
  if (!value) return null;
  const iso = value.trim().replace(' ', 'T').replace(/Z$/, 'Z');
  const ms = Date.parse(iso.endsWith('Z') ? iso : `${iso}Z`);
  return Number.isNaN(ms) ? null : ms;
}

/** The most current time the API has, when one differs from the schedule. */
function revisedTime(end?: ApiEnd): ApiTime | undefined {
  return end?.revisedTime ?? end?.predictedTime;
}

export function toFlightInfo(flight: ApiFlight, now: Date = new Date()): FlightInfo {
  const dep = flight.departure;
  const arr = flight.arrival;
  const depLocal = splitLocal(dep?.scheduledTime?.local);
  const arrLocal = splitLocal(arr?.scheduledTime?.local);

  // Duration is the scheduled block time, not today's delay.
  const depMs = utcMs(dep?.scheduledTime?.utc);
  const arrMs = utcMs(arr?.scheduledTime?.utc);

  const depRevised = splitLocal(revisedTime(dep)?.local);
  const arrRevised = splitLocal(revisedTime(arr)?.local);

  return {
    number: (flight.number ?? '').replace(/\s+/g, ' ').trim(),
    airline: flight.airline?.name ?? null,
    aircraft: flight.aircraft?.model ?? null,
    distanceKm: flight.greatCircleDistance?.km ?? null,
    status: flight.status ?? null,

    fromIata: dep?.airport?.iata ?? null,
    fromName: dep?.airport?.name ?? null,
    fromCity: dep?.airport?.municipalityName ?? null,
    fromCountry: dep?.airport?.countryCode ?? null,
    fromTerminal: dep?.terminal ?? null,
    fromGate: dep?.gate ?? null,
    fromLat: dep?.airport?.location?.lat ?? null,
    fromLon: dep?.airport?.location?.lon ?? null,
    departDate: depLocal.date,
    departTime: depLocal.time,

    toIata: arr?.airport?.iata ?? null,
    toName: arr?.airport?.name ?? null,
    toCity: arr?.airport?.municipalityName ?? null,
    toCountry: arr?.airport?.countryCode ?? null,
    toTerminal: arr?.terminal ?? null,
    toGate: arr?.gate ?? null,
    toLat: arr?.airport?.location?.lat ?? null,
    toLon: arr?.airport?.location?.lon ?? null,
    arriveDate: arrLocal.date,
    arriveTime: arrLocal.time,

    // Only report a revision when it actually differs from the schedule.
    departRevisedTime: depRevised.time && depRevised.time !== depLocal.time ? depRevised.time : null,
    arriveRevisedTime: arrRevised.time && arrRevised.time !== arrLocal.time ? arrRevised.time : null,

    durationMinutes: depMs !== null && arrMs !== null && arrMs > depMs
      ? Math.round((arrMs - depMs) / 60_000)
      : null,
    checkedAt: now.toISOString(),
  };
}

export type LookupResult =
  | { ok: true; flights: FlightInfo[] }
  | { ok: false; reason: 'no-key' | 'not-found' | 'rate-limited' | 'failed'; message: string };

/** '2026-09-10' — the API wants a plain local date. */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Looks up every leg published under a flight number on a date.
 *
 * A number can return more than one leg (a tag flight, or the return), so this
 * hands back all of them and lets the caller choose rather than guessing.
 */
export async function lookupFlight(
  flightNumber: string,
  date: string,
  fetchImpl: typeof fetch = fetch
): Promise<LookupResult> {
  const key = process.env.EXPO_PUBLIC_AERODATABOX_KEY;
  if (!key) {
    return { ok: false, reason: 'no-key', message: 'No flight lookup key configured.' };
  }

  const number = flightNumber.replace(/\s+/g, '').toUpperCase();
  if (!number || !isValidDate(date)) {
    return { ok: false, reason: 'failed', message: 'Enter a flight number and a date first.' };
  }

  const url =
    `https://${HOST}/flights/number/${encodeURIComponent(number)}/${date}` +
    '?withAircraftImage=false&withLocation=false&withFlightPlan=false&dateLocalRole=Both';

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': HOST },
    });

    if (response.status === 404) {
      return { ok: false, reason: 'not-found', message: `No ${number} found on that date.` };
    }
    // The free plan limits per second as well as per month.
    if (response.status === 429) {
      return {
        ok: false,
        reason: 'rate-limited',
        message: 'Too many lookups just now — try again in a moment.',
      };
    }
    if (!response.ok) {
      return { ok: false, reason: 'failed', message: `Lookup failed (${response.status}).` };
    }

    const payload = (await response.json()) as ApiFlight[] | ApiFlight;
    const list = Array.isArray(payload) ? payload : [payload];
    const flights = list.filter(Boolean).map((flight) => toFlightInfo(flight));

    if (!flights.length) {
      return { ok: false, reason: 'not-found', message: `No ${number} found on that date.` };
    }
    return { ok: true, flights };
  } catch {
    return { ok: false, reason: 'failed', message: 'Could not reach the flight service.' };
  }
}

/** 'JP' -> 🇯🇵, using regional indicator letters. */
export function countryFlag(code?: string | null): string {
  if (!code || code.length !== 2) return '';
  const base = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(base + upper.charCodeAt(0) - 65, base + upper.charCodeAt(1) - 65);
}

/** 435 -> '7h 15m' */
export function formatMinutes(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}
