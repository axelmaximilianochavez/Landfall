export type NewExpenseInput = {
  tripId: string;
  description: string;
  category: string;
  amountMinor: number;
  currency: string;
  paidByPersonId: string;
  spentAt: Date;
  coveredPersonIds: string[];
  rateToBaseMicros?: number;
  itemId?: string | null;
};

const unavailable = () => {
  throw new Error('The database is unavailable on web. Run on iOS or Android.');
};

export function createExpense(_input: NewExpenseInput): string {
  return unavailable();
}

export function deleteExpense(_expenseId: string): void {
  unavailable();
}
