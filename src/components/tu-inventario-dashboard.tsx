"use client";

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import type { Product, SortConfig } from "@/lib/types";
import { DashboardHeader } from './dashboard-header';
import { DashboardStats } from './dashboard-stats';
import { ProductList } from './product-list';

export function TuInventarioDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'expiryDate', direction: 'ascending' });

  const products = useLiveQuery(() => db.products.toArray(), []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = { ...product, id: crypto.randomUUID() };
      await db.products.add(newProduct);
      toast({
        title: "Producto Añadido",
        description: `${product.name} ha sido añadido a tu inventario.`,
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

  const deleteProduct = async (productId: string) => {
    try {
        const product = await db.products.get(productId);
        await db.products.delete(productId);
        toast({
            title: "Producto Eliminado",
            description: `${product?.name || 'El producto'} ha sido eliminado.`,
        });
    } catch (error) {
        console.error("Failed to delete product: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo eliminar el producto.",
        });
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const sortedProducts = useMemo(() => {
    if (!filteredProducts) return [];
    const sortableProducts = [...filteredProducts];
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortConfig.key === 'expiryDate') {
          aValue = a.expiryDate.getTime();
          bValue = b.expiryDate.getTime();
        } else if (sortConfig.key === 'name') {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else {
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

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="m-2 lg:m-4 border rounded-lg shadow-sm bg-card">
        <DashboardHeader onProductAdd={addProduct} />
        <DashboardStats products={products || []} />
        <ProductList
          products={sortedProducts}
          onDeleteProduct={deleteProduct}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          sortConfig={sortConfig}
          onSortConfigChange={setSortConfig}
        />
      </div>
    </div>
  );
}
