import type { TimelineItem } from '@/db/queries/trip';
import type { ItemDetails, ItemKind } from '@/db/schema';

import type { FlightInfo } from './flight-lookup';

import { fromISODate, toISODate } from './date';

/** The lookup-sourced fields, kept together so they travel as one unit. */
export type FlightLookupFields = {
  airline?: string;
  aircraft?: string;
  airportFromName?: string;
  airportToName?: string;
  cityFrom?: string;
  cityTo?: string;
  countryFrom?: string;
  countryTo?: string;
  distanceKm?: number;
  durationMinutes?: number;
  liveStatus?: string;
  revisedDeparture?: string;
  revisedArrival?: string;
  fromLat?: number;
  fromLon?: number;
  toLat?: number;
  toLon?: number;
  lookedUpAt?: string;
};

const skipNull = <T,>(value: T | null | undefined): T | undefined =>
  value === null ? undefined : value;

/** Turns a lookup result into the form fields it should overwrite. */
export function applyFlightInfo(state: ItemFormState, info: FlightInfo): ItemFormState {
  return {
    ...state,
    kind: 'flight',
    code: info.number || state.code,
    from: info.fromIata ?? state.from,
    to: info.toIata ?? state.to,
    fromTerminal: info.fromTerminal ?? '',
    toTerminal: info.toTerminal ?? '',
    gate: info.fromGate ?? state.gate,
    date: info.departDate ?? state.date,
    time: info.departTime ?? state.time,
    endTime: info.arriveTime ?? state.endTime,
    lookup: {
      airline: skipNull(info.airline),
      aircraft: skipNull(info.aircraft),
      airportFromName: skipNull(info.fromName),
      airportToName: skipNull(info.toName),
      cityFrom: skipNull(info.fromCity),
      cityTo: skipNull(info.toCity),
      countryFrom: skipNull(info.fromCountry),
      countryTo: skipNull(info.toCountry),
      distanceKm: skipNull(info.distanceKm),
      durationMinutes: skipNull(info.durationMinutes),
      liveStatus: skipNull(info.status),
      revisedDeparture: skipNull(info.departRevisedTime),
      revisedArrival: skipNull(info.arriveRevisedTime),
      fromLat: skipNull(info.fromLat),
      fromLon: skipNull(info.fromLon),
      toLat: skipNull(info.toLat),
      toLon: skipNull(info.toLon),
      lookedUpAt: info.checkedAt,
    },
  };
}

export type FormKind = 'flight' | 'train' | 'stay' | 'place';

export type ItemFormState = {
  kind: FormKind;
  /** Flight number, or train operator. */
  code: string;
  from: string;
  to: string;
  /** Hotel or place name. */
  name: string;
  seat: string;
  gate: string;
  fromTerminal: string;
  toTerminal: string;
  confirmation: string;
  /** Carriage number, trains only. */
  car: string;
  /** Room number and type, stays only. */
  room: string;
  phone: string;
  /** Opening hours, places only. */
  openingHours: string;
  /** Everything the flight lookup filled in, carried through unedited. */
  lookup: FlightLookupFields | null;
  address: string;
  note: string;
  date: string | null;
  time: string | null;
  /** Arrival clock time. Rolls to the next day when it precedes departure. */
  endTime: string | null;
  /** Check-out, stays only. */
  endDate: string | null;
  segmentId: string | null;
  personIds: string[] | null;
};

/** The picker maps onto the four ItemKinds the schema stores. */
export const ITEM_KIND: Record<FormKind, ItemKind> = {
  flight: 'flight',
  train: 'transport',
  stay: 'lodging',
  place: 'activity',
};

export const FORM_KIND: Record<ItemKind, FormKind> = {
  flight: 'flight',
  transport: 'train',
  lodging: 'stay',
  activity: 'place',
};

export function isTransitKind(kind: FormKind): boolean {
  return kind === 'flight' || kind === 'train';
}

function clockOf(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Splits a legacy "A → B" title, for items saved before from/to were stored.
 *
 * Only when the arrow is actually there — otherwise a title like "TR 885"
 * would land whole in the From field.
 */
function splitLegacyTitle(title: string): { from: string; to: string } {
  if (!title.includes('→')) return { from: '', to: '' };
  const [from = '', to = ''] = title.split('→').map((part) => part.trim());
  return { from, to };
}

/** Fills the form from a stored item, so an edit opens on exactly what exists. */
export function formStateFromItem(item?: TimelineItem): ItemFormState {
  if (!item) {
    return {
      kind: 'flight',
      code: '',
      from: '',
      to: '',
      name: '',
      seat: '',
      gate: '',
      fromTerminal: '',
      toTerminal: '',
      confirmation: '',
      car: '',
      room: '',
      phone: '',
      openingHours: '',
      lookup: null,
      address: '',
      note: '',
      date: null,
      time: null,
      endTime: null,
      endDate: null,
      segmentId: null,
      personIds: null,
    };
  }

  const details = item.details;
  const transit = details?.kind === 'flight' || details?.kind === 'transport' ? details : null;
  const legacy = transit ? splitLegacyTitle(item.title) : { from: '', to: '' };

  const stayOrPlace = details?.kind === 'lodging' || details?.kind === 'activity' ? details : null;

  return {
    kind: FORM_KIND[item.kind],
    code:
      details?.kind === 'flight'
        ? (details.flightNumber ?? '')
        : details?.kind === 'transport'
          ? (details.operator ?? '')
          : '',
    from: transit?.from ?? legacy.from,
    to: transit?.to ?? legacy.to,
    name: transit ? '' : item.title,
    seat: transit?.seat ?? '',
    gate: details?.kind === 'flight' ? (details.gate ?? '') : '',
    fromTerminal: transit?.departureTerminal ?? '',
    toTerminal: transit?.arrivalTerminal ?? '',
    confirmation:
      details && 'confirmationCode' in details ? (details.confirmationCode ?? '') : '',
    car: details?.kind === 'transport' ? (details.car ?? '') : '',
    room: details?.kind === 'lodging' ? (details.room ?? '') : '',
    phone: details?.kind === 'lodging' ? (details.phone ?? '') : '',
    openingHours: details?.kind === 'activity' ? (details.openingHours ?? '') : '',
    lookup:
      details?.kind === 'flight' && details.lookedUpAt
        ? {
            airline: details.airline,
            aircraft: details.aircraft,
            airportFromName: details.airportFromName,
            airportToName: details.airportToName,
            cityFrom: details.cityFrom,
            cityTo: details.cityTo,
            countryFrom: details.countryFrom,
            countryTo: details.countryTo,
            distanceKm: details.distanceKm,
            durationMinutes: details.durationMinutes,
            liveStatus: details.liveStatus,
            revisedDeparture: details.revisedDeparture,
            revisedArrival: details.revisedArrival,
            fromLat: details.fromLat,
            fromLon: details.fromLon,
            toLat: details.toLat,
            toLon: details.toLon,
            lookedUpAt: details.lookedUpAt,
          }
        : null,
    // Older rows kept the address in notes, before details.address existed.
    address: stayOrPlace?.address ?? (stayOrPlace ? (item.notes ?? '') : ''),
    note: stayOrPlace?.address ? (item.notes ?? '') : transit ? (item.notes ?? '') : '',
    date: item.startAt ? toISODate(item.startAt) : null,
    time: item.startAt && !item.isAllDay ? clockOf(item.startAt) : null,
    endTime: item.endAt ? clockOf(item.endAt) : null,
    endDate: item.endAt ? toISODate(item.endAt) : null,
    segmentId: item.segmentId,
    personIds: item.people.map((p) => p.personId),
  };
}

export type ItemPayload = {
  kind: ItemKind;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
  isAllDay: boolean;
  notes: string | null;
  details: ItemDetails;
};

/** Turns form state back into the columns the schema stores. */
export function itemPayloadFromState(state: ItemFormState): ItemPayload {
  const transit = isTransitKind(state.kind);

  const title = transit
    ? state.from.trim() && state.to.trim()
      ? `${state.from.trim()} → ${state.to.trim()}`
      : state.code.trim()
    : state.name.trim();

  let startAt: Date | null = null;
  if (state.date) {
    startAt = fromISODate(state.date);
    if (state.time) {
      const [h, m] = state.time.split(':').map(Number);
      startAt.setHours(h ?? 0, m ?? 0, 0, 0);
    }
  }

  let endAt: Date | null = null;
  if (state.kind === 'stay') {
    // A stay ends on its own date — check-out is days later, not hours.
    if (state.endDate) {
      endAt = fromISODate(state.endDate);
      if (state.endTime) {
        const [h, m] = state.endTime.split(':').map(Number);
        endAt.setHours(h ?? 0, m ?? 0, 0, 0);
      }
    }
  } else if (startAt && state.endTime) {
    // An arrival earlier than departure is an overnight leg, not a mistake.
    const [h, m] = state.endTime.split(':').map(Number);
    endAt = new Date(startAt);
    endAt.setHours(h ?? 0, m ?? 0, 0, 0);
    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
  }

  const blank = (value: string) => value.trim() || undefined;

  const details: ItemDetails =
    state.kind === 'flight'
      ? {
          kind: 'flight',
          flightNumber: blank(state.code),
          seat: blank(state.seat),
          gate: blank(state.gate),
          from: blank(state.from),
          to: blank(state.to),
          departureTerminal: blank(state.fromTerminal),
          arrivalTerminal: blank(state.toTerminal),
          confirmationCode: blank(state.confirmation),
          ...(state.lookup ?? {}),
        }
      : state.kind === 'train'
        ? {
            kind: 'transport',
            mode: 'train',
            operator: blank(state.code),
            from: blank(state.from),
            to: blank(state.to),
            departureTerminal: blank(state.fromTerminal),
            arrivalTerminal: blank(state.toTerminal),
            car: blank(state.car),
            seat: blank(state.seat),
            confirmationCode: blank(state.confirmation),
          }
        : state.kind === 'stay'
          ? {
              kind: 'lodging',
              address: blank(state.address),
              room: blank(state.room),
              phone: blank(state.phone),
              confirmationCode: blank(state.confirmation),
            }
          : {
              kind: 'activity',
              address: blank(state.address),
              openingHours: blank(state.openingHours),
            };

  return {
    kind: ITEM_KIND[state.kind],
    title,
    startAt,
    endAt,
    isAllDay: !!state.date && !state.time,
    notes: blank(state.note) ?? null,
    details,
  };
}
