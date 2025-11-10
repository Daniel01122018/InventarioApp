export type Product = {
  id: string;
  name: string;
  expiryDate: Date;
};

export type SortKey = keyof Product | 'timeRemaining';

export type SortDirection = 'ascending' | 'descending';

export type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};
