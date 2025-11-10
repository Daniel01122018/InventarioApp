"use client";

import { useMemo } from "react";
import type { ProductWithInventory, ConsumedItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, BellRing, AlertTriangle, PackagePlus, PackageMinus, TrendingUp, Zap } from "lucide-react";
import { differenceInDays, startOfMonth, isWithinInterval, subMonths } from "date-fns";

interface ReportsDashboardProps {
    products: ProductWithInventory[];
    consumedItems: ConsumedItem[];
}

export function ReportsDashboard({ products, consumedItems }: ReportsDashboardProps) {

    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));
        
        let expiringSoonCount = 0;
        let expiredCount = 0;
        let totalItems = 0;
        let expiredThisMonthCount = 0;
        let productWithMostStock: ProductWithInventory | null = null;
        let productWithLeastStock: ProductWithInventory | null = null;
        
        const consumedLast30Days = new Map<string, number>();
        consumedItems.forEach(item => {
             if (differenceInDays(now, item.consumedDate) <= 30) {
                 const currentQty = consumedLast30Days.get(item.productId) || 0;
                 consumedLast30Days.set(item.productId, currentQty + item.quantity);
             }
        });

        let mostRotatedProduct: { name: string, quantity: number, unit: string } | null = null;
        if(consumedLast30Days.size > 0){
            const mostRotatedProductId = [...consumedLast30Days.entries()].sort((a, b) => b[1] - a[1])[0][0];
            const productInfo = products.find(p => p.id === mostRotatedProductId);
            if(productInfo) {
                mostRotatedProduct = {
                    name: productInfo.name,
                    quantity: consumedLast30Days.get(mostRotatedProductId)!,
                    unit: productInfo.unit
                }
            }
        }


        if (!products || products.length === 0) {
            return {
                totalItems,
                expiringSoonCount,
                expiredCount,
                expiredThisMonthCount,
                productWithMostStock: null,
                productWithLeastStock: null,
                mostRotatedProduct: null,
            };
        }

        products.forEach((product) => {
            totalItems += product.totalQuantity;

            if (!productWithMostStock || product.totalQuantity > productWithMostStock.totalQuantity) {
                productWithMostStock = product;
            }
            if (!productWithLeastStock || product.totalQuantity < productWithLeastStock.totalQuantity) {
                productWithLeastStock = product;
            }

            product.inventory.forEach(item => {
                const daysUntilExpiry = differenceInDays(item.expiryDate, now);
                
                if (daysUntilExpiry < 0) {
                    expiredCount += item.quantity;
                    if (isWithinInterval(item.expiryDate, { start: startOfThisMonth, end: now })) {
                        expiredThisMonthCount += item.quantity;
                    }
                } else if (daysUntilExpiry <= 7) {
                    expiringSoonCount += item.quantity;
                }
            });
        });

        return {
            totalItems,
            expiringSoonCount,
            expiredCount,
            expiredThisMonthCount,
            productWithMostStock,
            productWithLeastStock,
            mostRotatedProduct
        };
    }, [products, consumedItems]);


    return (
        <div className="p-4 sm:p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Artículos Totales</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">en tu inventario</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">A punto de caducar (7 días)</CardTitle>
                        <BellRing className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-accent">{stats.expiringSoonCount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">artículos caducan pronto</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Artículos Caducados</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.expiredCount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">han pasado su fecha de caducidad</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mayor Rotación (30 días)</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{stats.mostRotatedProduct?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.mostRotatedProduct ? `${stats.mostRotatedProduct.quantity.toLocaleString()} ${stats.mostRotatedProduct.unit} consumidos` : 'No hay datos de consumo'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Producto con Más Stock</CardTitle>
                        <PackagePlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{stats.productWithMostStock?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.productWithMostStock ? `${stats.productWithMostStock.totalQuantity.toLocaleString()} ${stats.productWithMostStock.unit}` : 'No hay productos'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Producto con Menos Stock</CardTitle>
                        <PackageMinus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{stats.productWithLeastStock?.name || 'N/A'}</div>
                         <p className="text-xs text-muted-foreground">
                            {stats.productWithLeastStock ? `${stats.productWithLeastStock.totalQuantity.toLocaleString()} ${stats.productWithLeastStock.unit}` : 'No hay productos'}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Artículos Caducados Este Mes</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiredThisMonthCount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">desde el inicio del mes</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
