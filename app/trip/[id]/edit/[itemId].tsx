import { useLocalSearchParams } from 'expo-router';

import { ItemForm } from '@/components/item-form';
import { FormFallback } from '@/components/item-form-fallback';
import { useTrip } from '@/db/queries/trip';

export default function EditItem() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const { trip, error } = useTrip(id);
  const item = trip?.items.find((candidate) => candidate.id === itemId);

  if (!trip) return <FormFallback error={error} />;
  // Deleting the item pops this screen, but the live query can re-render once
  // more before that happens — so a missing item is a normal transient state.
  if (!item) return <FormFallback message="This item is no longer on the trip." />;

  // Keyed so the form re-initialises if the route is reused for another item.
  return <ItemForm key={item.id} trip={trip} item={item} />;
}
