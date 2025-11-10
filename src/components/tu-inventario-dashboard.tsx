"use client";

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductWithInventory, SortConfig, InventoryItem, Notification } from "@/lib/types";
import { DashboardHeader } from './dashboard-header';
import { DashboardStats } from './dashboard-stats';
import { ProductList } from './product-list';
import { differenceInDays } from 'date-fns';

export function TuInventarioDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nextExpiryDate', direction: 'ascending' });

  const products = useLiveQuery(() => db.products.toArray(), []);
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const notifications = useLiveQuery(() => db.notifications.where('read').equals(0).toArray(), []);

  const updateNotifications = async (items: InventoryItem[], allProducts: Product[]) => {
    if (!items || !allProducts) return;
  
    const now = new Date();
    const productMap = new Map(allProducts.map(p => [p.id, p.name]));
  
    for (const item of items) {
      const daysUntilExpiry = differenceInDays(item.expiryDate, now);
      const productName = productMap.get(item.productId);
  
      if (!productName) continue;
  
      const existingNotification = await db.notifications.get({ inventoryItemId: item.id });
  
      if (daysUntilExpiry <= 7) {
        if (!existingNotification) {
          await db.notifications.add({
            id: crypto.randomUUID(),
            inventoryItemId: item.id,
            productName,
            quantity: item.quantity,
            expiryDate: item.expiryDate,
            daysUntilExpiry,
            read: false,
          });
        } else if (existingNotification.daysUntilExpiry !== daysUntilExpiry) {
          await db.notifications.update(existingNotification.id, { daysUntilExpiry });
        }
      } else {
        if (existingNotification) {
          await db.notifications.delete(existingNotification.id);
        }
      }
    }
  };

  useEffect(() => {
    if(inventory && products) {
      const interval = setInterval(() => {
        updateNotifications(inventory, products);
      }, 1000 * 60 * 60 * 24); // Check once a day
      updateNotifications(inventory, products); // Initial check
      return () => clearInterval(interval);
    }
  }, [inventory, products]);

  const addProduct = async (values: { product: { id?: string; name: string; }; quantity: number; expiryDate: Date; }) => {
    try {
      let productId = values.product.id;
      if (!productId) {
        const existingProduct = await db.products.where('name').equalsIgnoreCase(values.product.name).first();
        if (existingProduct) {
          productId = existingProduct.id;
        } else {
          const newProduct = { name: values.product.name, id: crypto.randomUUID() };
          const newProductId = await db.products.add(newProduct);
          productId = newProductId as string;
        }
      }

      if (!productId) throw new Error("Could not create or find product.");

      const newInventoryItem = {
        id: crypto.randomUUID(),
        productId: productId,
        quantity: values.quantity,
        expiryDate: values.expiryDate
      };

      await db.inventory.add(newInventoryItem);
      
      toast({
        title: "Producto Añadido",
        description: `${values.quantity} x ${values.product.name} ha sido añadido a tu inventario.`,
      });
      // Trigger notification check
      const currentProducts = await db.products.toArray();
      const currentInventory = await db.inventory.toArray();
      await updateNotifications(currentInventory, currentProducts);

    } catch (error) {
      console.error("Failed to add product: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el producto.",
      });
    }
  };

  const deleteInventoryItem = async (inventoryItemId: string) => {
    try {
        const item = await db.inventory.get(inventoryItemId);
        if(item) {
          const product = await db.products.get(item.productId);
          await db.inventory.delete(inventoryItemId);
          // Also delete associated notification
          const notification = await db.notifications.get({ inventoryItemId: inventoryItemId });
          if (notification) {
            await db.notifications.delete(notification.id);
          }
          toast({
              title: "Lote Eliminado",
              description: `El lote de ${product?.name || 'producto'} ha sido eliminado.`,
          });
        }
    } catch (error) {
        console.error("Failed to delete inventory item: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo eliminar el lote.",
        });
    }
  };
  
  const productsWithInventory = useMemo<ProductWithInventory[]>(() => {
    if (!products || !inventory) return [];
    
    const inventoryByProduct = new Map<string, InventoryItem[]>();
    inventory.forEach(item => {
      const items = inventoryByProduct.get(item.productId) || [];
      items.push(item);
      inventoryByProduct.set(item.productId, items);
    });

    return products
      .map(product => {
        const items = inventoryByProduct.get(product.id) || [];
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        return {
          ...product,
          inventory: items.sort((a,b) => a.expiryDate.getTime() - b.expiryDate.getTime()),
          totalQuantity,
        };
      })
      .filter(p => p.totalQuantity > 0);
  }, [products, inventory]);


  const filteredProducts = useMemo(() => {
    if (!productsWithInventory) return [];
    return productsWithInventory.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productsWithInventory, searchTerm]);

  const sortedProducts = useMemo(() => {
    if (!filteredProducts) return [];
    const sortableProducts = [...filteredProducts];
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch(sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'totalQuantity':
            aValue = a.totalQuantity;
            bValue = b.totalQuantity;
            break;
          case 'nextExpiryDate':
            const aNextExpiry = a.inventory[0]?.expiryDate.getTime() ?? Infinity;
            const bNextExpiry = b.inventory[0]?.expiryDate.getTime() ?? Infinity;
            aValue = aNextExpiry;
            bValue = bNextExpiry;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [filteredProducts, sortConfig]);

  const handleNotificationRead = async (id: string) => {
    try {
      await db.notifications.update(id, { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read: ", error);
    }
  };
  
  const handleClearNotifications = async () => {
    try {
      const readNotifications = await db.notifications.where('read').equals(1).toArray();
      await db.notifications.bulkDelete(readNotifications.map(n => n.id));
    } catch (error) {
      console.error("Failed to clear read notifications: ", error);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="m-2 lg:m-4 border rounded-lg shadow-sm bg-card">
        <DashboardHeader 
          products={products || []}
          notifications={notifications || []}
          onProductAdd={addProduct}
          onNotificationRead={handleNotificationRead}
          onClearNotifications={handleClearNotifications}
        />
        <DashboardStats products={productsWithInventory || []} />
        <ProductList
          products={sortedProducts}
          onDeleteInventoryItem={deleteInventoryItem}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          sortConfig={sortConfig}
          onSortConfigChange={setSortConfig}
        />
      </div>
    </div>
  );
}
