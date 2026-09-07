import { useLocalSearchParams } from 'expo-router';

import { ItemDetail } from '@/components/item-detail';
import { FormFallback } from '@/components/item-form-fallback';
import { useTrip } from '@/db/queries/trip';

export default function ItemDetailScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const { trip, error } = useTrip(id);
  const item = trip?.items.find((candidate) => candidate.id === itemId);

  if (!trip) return <FormFallback error={error} />;
  if (!item) return <FormFallback message="This item is no longer on the trip." />;
  return <ItemDetail trip={trip} item={item} />;
}
