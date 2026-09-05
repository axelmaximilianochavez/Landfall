import { randomUUID } from 'expo-crypto';

/**
 * Row ids are client-generated UUIDs, never autoincrement — see db/schema/_base.ts.
 * That way a device can create rows offline without colliding with the server.
 */
export function newId(): string {
  return randomUUID();
}
