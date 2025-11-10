import { ShieldCheck, Bell } from "lucide-react";
import { AddProductDialog } from "./add-product-dialog";
import { NotificationCenter } from './notification-center';
import type { Product, Notification } from "@/lib/types";

interface DashboardHeaderProps {
  products: Product[];
  notifications: Notification[];
  onProductAdd: (values: { product: { id?: string; name: string; }; quantity: number; expiryDate: Date; }) => void;
  onNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}

export function DashboardHeader({ products, notifications, onProductAdd, onNotificationRead, onClearNotifications }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl font-headline">
          Tu Inventario
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <NotificationCenter 
          notifications={notifications} 
          onNotificationRead={onNotificationRead}
          onClearNotifications={onClearNotifications}
        />
        <AddProductDialog products={products} onProductAdd={onProductAdd} />
      </div>
    </header>
  );
}
