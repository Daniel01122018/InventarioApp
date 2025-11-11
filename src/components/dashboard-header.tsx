import { ShieldCheck } from "lucide-react";
import { AddProductDialog } from "./add-product-dialog";
import { ConsumeProductDialog } from "./consume-product-dialog";
import type { Product, ProductWithInventory } from "@/lib/types";

interface DashboardHeaderProps {
  products: Product[];
  productsWithInventory: ProductWithInventory[];
  onProductAdd: (values: { product: { id?: string; name: string; unit: 'unidades' | 'kg' | 'g' | 'lb' | 'litros' | 'ml'; }; quantity: number; expiryDate: Date; }) => void;
  onConsumeProduct: (inventoryItemId: string, quantity: number) => Promise<void>;
}

export function DashboardHeader({ products, productsWithInventory, onProductAdd, onConsumeProduct }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b p-4 sm:p-6">
      <div className="flex items-center gap-3 self-start">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-headline">
          Tu Inventario
        </h1>
      </div>
      <div className="grid grid-cols-2 sm:flex w-full sm:w-auto items-center gap-2">
        <ConsumeProductDialog 
          productsWithInventory={productsWithInventory}
          onConsume={onConsumeProduct}
        />
        <AddProductDialog products={products} onProductAdd={onProductAdd} />
      </div>
    </header>
  );
}
