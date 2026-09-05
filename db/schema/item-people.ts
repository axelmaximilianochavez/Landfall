import { relations } from 'drizzle-orm';
import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { base } from './_base';
import { items } from './items';
import { people } from './people';

/**
 * Who is on a given itinerary item — "Who's on this flight" in the design.
 *
 * Separate from expense_shares on purpose: being on a flight is not the same
 * as paying for it, and the two diverge constantly.
 */
export const itemPeople = sqliteTable(
  'item_people',
  {
    ...base(),
    itemId: text('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    personId: text('person_id')
      .notNull()
      .references(() => people.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('item_people_unique').on(t.itemId, t.personId),
    index('item_people_person_idx').on(t.personId),
  ]
);

export const itemPeopleRelations = relations(itemPeople, ({ one }) => ({
  item: one(items, { fields: [itemPeople.itemId], references: [items.id] }),
  person: one(people, { fields: [itemPeople.personId], references: [people.id] }),
}));

export type ItemPerson = typeof itemPeople.$inferSelect;
export type NewItemPerson = typeof itemPeople.$inferInsert;
