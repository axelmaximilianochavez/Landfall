import type { Person } from '@/db/schema';

/**
 * Invite state, derived rather than stored.
 *
 * `userId` is only ever set by someone accepting an invite, so it already
 * answers "is this a real account?". A status column alongside it would be a
 * second source of truth that can disagree with the first.
 *
 * Note a declined invite is indistinguishable from a pending one here. That is
 * fine until there is a server that can tell us; a status column earns its
 * place the day we want to show "declined".
 */
export type InviteStatus = 'accepted' | 'pending' | 'none';

export function inviteStatusOf(person: Person): InviteStatus {
  if (person.userId) return 'accepted';
  if (person.invitedAt) return 'pending';
  return 'none';
}

/**
 * People arrive from either end: a name (added under "Travelling with") or an
 * email (invited directly, before we know what they are called).
 */
export function displayNameOf(person: Person): string {
  return person.displayName.trim() || person.email?.trim() || 'Someone';
}

export function initialOfPerson(person: Person): string {
  return (displayNameOf(person)[0] ?? '?').toUpperCase();
}
