"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { differenceInDays } from "date-fns";
import { Package, BellRing, AlertTriangle } from "lucide-react";
import type { Product } from "@/lib/types";
import { useMemo } from "react";

interface DashboardStatsProps {
  products: Product[];
}

export function DashboardStats({ products }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    let expiringSoon = 0;
    let expired = 0;

    products.forEach((product) => {
      const daysUntilExpiry = differenceInDays(product.expiryDate, now);
      if (daysUntilExpiry < 0) {
        expired++;
      } else if (daysUntilExpiry <= 7) {
        expiringSoon++;
      }
    });

    return {
      total: products.length,
      expiringSoon,
      expired,
    };
  }, [products]);

  return (
    <div className="grid gap-4 md:grid-cols-3 p-4 sm:p-6">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">in your inventory</p>
        </CardContent>
      </Card>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <BellRing className="h-4 w-4 text-accent-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{stats.expiringSoon}</div>
          <p className="text-xs text-muted-foreground">Within the next 7 days</p>
        </CardContent>
      </Card>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expired Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.expired}</div>
          <p className="text-xs text-muted-foreground">Have passed expiry date</p>
        </CardContent>
      </Card>
    </div>
  );
}
