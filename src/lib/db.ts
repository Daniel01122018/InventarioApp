import Dexie, { type EntityTable } from 'dexie';
import type { Product, InventoryItem, Notification } from './types';

export const db = new Dexie('TuInventarioDatabase') as Dexie & {
  products: EntityTable<Product, 'id'>;
  inventory: EntityTable<InventoryItem, 'id'>;
  notifications: EntityTable<Notification, 'id'>;
};

db.version(2).stores({
  products: 'id, name',
  inventory: 'id, productId, expiryDate',
  notifications: 'id, inventoryItemId, read'
}).upgrade(tx => {
    // Migración para la versión 2 para manejar el cambio de estructura.
    // Los datos antiguos no son directamente compatibles con el nuevo esquema de cantidad/lote.
    // Se eliminarán los datos antiguos para evitar inconsistencias.
    return Promise.all([
        tx.table('products').clear(),
        tx.table('inventory') ? tx.table('inventory').clear() : Promise.resolve(),
    ]);
});

db.version(1).stores({
  products: 'id, name, expiryDate',
});
