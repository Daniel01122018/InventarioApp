"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { differenceInDays } from "date-fns";
import { Package, BellRing, AlertTriangle } from "lucide-react";
import type { ProductWithInventory } from "@/lib/types";
import { useMemo } from "react";

interface DashboardStatsProps {
  products: ProductWithInventory[];
}

export function DashboardStats({ products }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    let expiringSoon = 0;
    let expired = 0;
    let totalItems = 0;

    if (!products) {
      return {
        total: 0,
        expiringSoon: 0,
        expired: 0,
      };
    }

    products.forEach((product) => {
      totalItems += product.totalQuantity;
      product.inventory.forEach(item => {
        const daysUntilExpiry = differenceInDays(item.expiryDate, now);
        if (daysUntilExpiry < 0) {
          expired += item.quantity;
        } else if (daysUntilExpiry <= 7) {
          expiringSoon += item.quantity;
        }
      });
    });

    return {
      total: totalItems,
      expiringSoon,
      expired,
    };
  }, [products]);

  return (
    <div className="grid gap-4 md:grid-cols-3 p-4 sm:p-6">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Artículos Totales</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">en tu inventario</p>
        </CardContent>
      </Card>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A punto de caducar</CardTitle>
          <BellRing className="h-4 w-4 text-accent-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">Dentro de los próximos 7 días</p>
        </CardContent>
      </Card>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Artículos Caducados</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
          <p className="text-xs text-muted-foreground">Han pasado la fecha de caducidad</p>
        </CardContent>
      </Card>
    </div>
  );
}
