export type Product = {
  id: string;
  name: string;
};

export type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  expiryDate: Date;
};

export type ProductWithInventory = Product & {
  inventory: InventoryItem[];
  totalQuantity: number;
};

export type SortKey = 'name' | 'totalQuantity' | 'nextExpiryDate';

export type SortDirection = 'ascending' | 'descending';

export type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};
