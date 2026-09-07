import { useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '@/components/expense-form';
import { FormFallback } from '@/components/item-form-fallback';
import { useTrip } from '@/db/queries/trip';

export default function NewExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip, error } = useTrip(id);

  if (!trip) return <FormFallback error={error} />;
  return <ExpenseForm trip={trip} />;
}
