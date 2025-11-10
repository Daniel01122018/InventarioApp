"use client";

import { useState, useMemo } from 'react';
import { addDays } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import type { Product, SortConfig } from "@/lib/types";
import { DashboardHeader } from './dashboard-header';
import { DashboardStats } from './dashboard-stats';
import { ProductList } from './product-list';

const initialProducts: Product[] = [
  { id: '1', name: 'Organic Milk', expiryDate: addDays(new Date(), 5) },
  { id: '2', name: 'Free-range Eggs', expiryDate: addDays(new Date(), 12) },
  { id: '3', name: 'Greek Yogurt', expiryDate: addDays(new Date(), -2) },
  { id: '4', name: 'Cheddar Cheese', expiryDate: addDays(new Date(), 30) },
  { id: '5', name: 'Chicken Breast', expiryDate: addDays(new Date(), 2) },
  { id: '6', name: 'Bag of Spinach', expiryDate: addDays(new Date(), 7) },
];

export function ExpiryGuardDashboard() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'expiryDate', direction: 'ascending' });

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: crypto.randomUUID() };
    setProducts(prevProducts => [...prevProducts, newProduct]);
    toast({
      title: "Product Added",
      description: `${product.name} has been added to your inventory.`,
    });
  };

  const deleteProduct = (productId: string) => {
    const productName = products.find(p => p.id === productId)?.name;
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    toast({
      variant: "destructive",
      title: "Product Deleted",
      description: `${productName || 'The product'} has been removed.`,
    });
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const sortedProducts = useMemo(() => {
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
        <DashboardStats products={products} />
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
