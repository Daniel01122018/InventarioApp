"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductWithInventory, SortConfig, InventoryItem, Unit, ConsumedItem } from "@/lib/types";
import { DashboardHeader } from './dashboard-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductList } from './product-list';
import { ReportsDashboard } from './reports-dashboard';
import { differenceInDays } from 'date-fns';
import { ProductManagementDashboard } from './product-management-dashboard';

export function ExpiryGuardDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nextExpiryDate', direction: 'ascending' });

  const products = useLiveQuery(() => db.products.toArray(), []);
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const consumedItems = useLiveQuery(() => db.consumedItems.toArray(), []);

  const addProduct = async (values: { product: { id?: string; name: string; unit: Unit; }; quantity: number; expiryDate: Date; }) => {
    try {
      let productId = values.product.id;
      if (!productId) {
        const existingProduct = await db.products.where('name').equalsIgnoreCase(values.product.name).first();
        if (existingProduct) {
          productId = existingProduct.id;
        } else {
          const newProduct: Product = { 
            name: values.product.name, 
            id: crypto.randomUUID(), 
            unit: values.product.unit,
            createdAt: new Date()
          };
          const newProductId = await db.products.add(newProduct);
          productId = newProductId as string;
        }
      }
      
      const productInfo = await db.products.get(productId);
      if (!productInfo) throw new Error("No se pudo crear o encontrar el producto.");

      const newInventoryItem: InventoryItem = {
        id: crypto.randomUUID(),
        productId: productId,
        quantity: values.quantity,
        expiryDate: values.expiryDate,
        unit: productInfo.unit,
      };

      await db.inventory.add(newInventoryItem);
      
      toast({
        title: "Producto Añadido",
        description: `${values.quantity} ${productInfo.unit} de ${values.product.name} ha sido añadido a tu inventario.`,
      });
      
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

  const consumeInventoryItem = async (inventoryItemId: string, quantityToConsume: number) => {
    try {
      const item = await db.inventory.get(inventoryItemId);
      if (!item) {
        throw new Error("El lote de inventario no existe.");
      }

      const product = await db.products.get(item.productId);
      if (!product) {
        throw new Error("El producto asociado al lote no existe.");
      }

      if (quantityToConsume > item.quantity) {
        throw new Error("No se puede consumir más de lo que hay en el lote.");
      }

      const consumedItem: ConsumedItem = {
        id: crypto.randomUUID(),
        productId: item.productId,
        productName: product.name,
        quantity: quantityToConsume,
        unit: item.unit,
        consumedDate: new Date(),
      };

      await db.consumedItems.add(consumedItem);

      const newQuantity = item.quantity - quantityToConsume;
      if (newQuantity > 0) {
        await db.inventory.update(inventoryItemId, { quantity: newQuantity });
      } else {
        await db.inventory.delete(inventoryItemId);
      }

      toast({
        title: "Producto Consumido",
        description: `Se han consumido ${quantityToConsume} ${item.unit} de ${product.name}.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo consumir el producto.";
      console.error("Failed to consume product: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const updateProduct = async (productId: string, newName: string, newUnit: Unit) => {
    try {
      const product = await db.products.get(productId);
      if (!product) throw new Error("El producto no existe.");

      await db.products.update(productId, { name: newName, unit: newUnit });
      
      // Update associated inventory items' units
      const inventoryToUpdate = await db.inventory.where({ productId: productId }).toArray();
      for (const item of inventoryToUpdate) {
        await db.inventory.update(item.id, { unit: newUnit });
      }

      // Update associated consumed items' names and units
      const consumedToUpdate = await db.consumedItems.where({ productId: productId }).toArray();
       for (const item of consumedToUpdate) {
        await db.consumedItems.update(item.id, { productName: newName, unit: newUnit });
      }

      toast({
        title: "Producto Actualizado",
        description: `"${product.name}" ha sido actualizado a "${newName}".`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el producto.";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      const inventoryCount = await db.inventory.where({ productId: productId }).count();
      if (inventoryCount > 0) {
        throw new Error("No se puede eliminar un producto que tiene lotes de inventario activos.");
      }
      
      const product = await db.products.get(productId);
      if (!product) throw new Error("El producto no existe.");

      // We can decide if we want to delete consumedItems history or not. For now, let's keep it.
      await db.products.delete(productId);

      toast({
        title: "Producto Eliminado",
        description: `El producto "${product.name}" ha sido eliminado.`,
      });

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "No se pudo eliminar el producto.";
       toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  }
  
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


  const filteredAndSortedProducts = useMemo(() => {
    const filtered = productsWithInventory.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
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
    
    return sorted;
  }, [productsWithInventory, searchTerm, sortConfig]);

  const expiringSoonProducts = useMemo(() => {
    return productsWithInventory
        .map(product => {
            const expiringInventory = product.inventory.filter(item => {
                const daysUntilExpiry = differenceInDays(item.expiryDate, new Date());
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
            });

            if (expiringInventory.length === 0) {
                return null;
            }

            return {
                ...product,
                inventory: expiringInventory,
                totalQuantity: expiringInventory.reduce((sum, item) => sum + item.quantity, 0),
            };
        })
        .filter((p): p is ProductWithInventory => p !== null);
}, [productsWithInventory]);


  return (
    <div className="container mx-auto max-w-7xl">
      <div className="m-2 lg:m-4 border rounded-lg shadow-sm bg-card">
        <DashboardHeader 
          products={products || []}
          productsWithInventory={productsWithInventory}
          onProductAdd={addProduct}
          onConsumeProduct={consumeInventoryItem}
        />
        <Tabs defaultValue="inventory" className="w-full">
            <div className='flex justify-start border-b px-4 sm:px-6'>
                <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto sm:flex-wrap h-auto">
                    <TabsTrigger value="inventory">Inventario</TabsTrigger>
                    <TabsTrigger value="expiring-soon">Próximos a Caducar</TabsTrigger>
                    <TabsTrigger value="reports">Reportes</TabsTrigger>
                    <TabsTrigger value="manage-products">Gestionar Productos</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="inventory">
                <ProductList
                    products={filteredAndSortedProducts}
                    onDeleteInventoryItem={deleteInventoryItem}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    sortConfig={sortConfig}
                    onSortConfigChange={setSortConfig}
                />
            </TabsContent>
            <TabsContent value="expiring-soon">
                <ProductList
                    products={expiringSoonProducts}
                    onDeleteInventoryItem={deleteInventoryItem}
                    searchTerm={""}
                    onSearchTermChange={()=>{}}
                    sortConfig={{ key: 'nextExpiryDate', direction: 'ascending' }}
                    onSortConfigChange={()=>{}}
                    isMinimalView={true}
                />
            </TabsContent>
            <TabsContent value="reports">
                <ReportsDashboard products={productsWithInventory} consumedItems={consumedItems || []} />
            </TabsContent>
            <TabsContent value="manage-products">
              <ProductManagementDashboard 
                products={products || []}
                onUpdateProduct={updateProduct}
                onDeleteProduct={deleteProduct}
              />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
