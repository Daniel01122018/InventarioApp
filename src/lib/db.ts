import Dexie, { type EntityTable } from 'dexie';
import type { Product } from './types';

export const db = new Dexie('TuInventarioDatabase') as Dexie & {
  products: EntityTable<Product, 'id'>;
};

db.version(1).stores({
  products: 'id, name, expiryDate',
});
