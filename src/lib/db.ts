import Dexie, { type EntityTable } from 'dexie';
import type { Product, InventoryItem } from './types';

export const db = new Dexie('TuInventarioDatabase') as Dexie & {
  products: EntityTable<Product, 'id'>;
  inventory: EntityTable<InventoryItem, 'id'>;
};

db.version(3).stores({
    products: 'id, name, unit',
    inventory: 'id, productId, expiryDate, unit',
}).upgrade(tx => {
    // This is a destructive migration. Old data will be cleared.
    return Promise.all([
        tx.table('products').clear(),
        tx.table('inventory').clear(),
    ]);
});

db.version(2).stores({
  products: 'id, name',
  inventory: 'id, productId, expiryDate',
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

// Remove notifications table from future versions if it existed
db.on('ready', () => {
    try {
        const currentVersion = db.verno;
        const newVersion = db.version(currentVersion + 1).stores({
            notifications: null // This deletes the table
        });
        return newVersion.upgrade(()=>{});
    } catch(e) {
        // Ignore if table doesn't exist
    }
});
