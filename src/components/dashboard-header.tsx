import { ShieldCheck } from "lucide-react";
import { AddProductDialog } from "./add-product-dialog";
import type { Product } from "@/lib/types";

interface DashboardHeaderProps {
  products: Product[];
  onProductAdd: (values: { product: { id?: string; name: string; }; quantity: number; expiryDate: Date; }) => void;
}

export function DashboardHeader({ products, onProductAdd }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-headline">
          Tu Inventario
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <AddProductDialog products={products} onProductAdd={onProductAdd} />
      </div>
    </header>
  );
}
