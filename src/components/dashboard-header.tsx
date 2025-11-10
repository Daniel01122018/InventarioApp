import { ShieldCheck } from "lucide-react";
import { AddProductDialog } from "./add-product-dialog";
import type { Product } from "@/lib/types";

interface DashboardHeaderProps {
    onProductAdd: (product: Omit<Product, 'id'>) => void;
}

export function DashboardHeader({ onProductAdd }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-headline">
          ExpiryGuard
        </h1>
      </div>
      <AddProductDialog onProductAdd={onProductAdd} />
    </header>
  );
}
