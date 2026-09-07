/**
 * Invite links.
 *
 * SECURITY NOTE: the code is derived from the trip id, which is fine while the
 * app is local-only and the link opens nothing. It is NOT a credential —
 * the derivation lives in the app bundle, so anyone holding a trip id can
 * compute the link. Before the join endpoint exists, replace this with a
 * random token stored on the trip and issued by the server, or the link
 * becomes a guessable key to someone else's trip.
 */

/** Crockford-ish: no 0/O/1/I, so a code read aloud cannot be mistyped. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const INVITE_HOST = 'landfall.app';

/** Stable, human-readable code for a trip, e.g. '8KQ2-TYO'. */
export function inviteCodeForTrip(tripId: string): string {
  const hex = tripId.replace(/[^0-9a-f]/gi, '');
  const chars: string[] = [];
  for (let i = 0; i < 7; i++) {
    const pair = hex.slice(i * 2, i * 2 + 2) || '0';
    chars.push(ALPHABET[parseInt(pair, 16) % ALPHABET.length]);
  }
  return `${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
}

/** What is shown in the field, without a scheme — as in the design. */
export function inviteLinkForTrip(tripId: string): string {
  return `${INVITE_HOST}/j/${inviteCodeForTrip(tripId)}`;
}

/** What actually gets copied and shared, so it is tappable in a message. */
export function inviteUrlForTrip(tripId: string): string {
  return `https://${inviteLinkForTrip(tripId)}`;
}
