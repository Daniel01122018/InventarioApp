export type Unit = 'unidades' | 'kg' | 'g' | 'lb' | 'litros' | 'ml';

export type Product = {
  id: string;
  name: string;
  unit: Unit;
};

export type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  expiryDate: Date;
  unit: Unit;
};

export type ConsumedItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: Unit;
  consumedDate: Date;
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
