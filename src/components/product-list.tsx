"use client";

import { useState } from "react";
import { differenceInDays, format, formatDistanceToNowStrict } from "date-fns";
import { es } from 'date-fns/locale';
import { ArrowUpDown, Search, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { ProductWithInventory, InventoryItem, SortConfig } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type SortableKeys = 'name' | 'totalQuantity' | 'nextExpiryDate';

interface ProductListProps {
  products: ProductWithInventory[];
  onDeleteInventoryItem: (id: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  sortConfig: SortConfig;
  onSortConfigChange: (config: SortConfig) => void;
  isMinimalView?: boolean;
}

export function ProductList({
  products,
  onDeleteInventoryItem,
  searchTerm,
  onSearchTermChange,
  sortConfig,
  onSortConfigChange,
  isMinimalView = false
}: ProductListProps) {
  const [itemToDelete, setItemToDelete] = useState<InventoryItem & { productName: string } | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    onSortConfigChange({ key, direction });
  };

  const getSortIndicator = (key: SortableKeys) => {
    if (isMinimalView || !sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const getStatus = (expiryDate: Date): { label: 'Caducado' | 'A punto de caducar' | 'Fresco', variant: 'destructive' | 'accent' | 'default' } => {
    const days = differenceInDays(expiryDate, new Date());
    if (days < 0) return { label: 'Caducado', variant: 'destructive' };
    if (days <= 7) return { label: 'A punto de caducar', variant: 'accent' };
    return { label: 'Fresco', variant: 'default' };
  };

  const toggleCollapsible = (productId: string) => {
    setOpenCollapsibles(prev => ({...prev, [productId]: !prev[productId]}));
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <CardContent className="p-4">
            {!isMinimalView && (
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="pl-10"
                    />
                    </div>
                </div>
            )}
          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')} disabled={isMinimalView}>
                      Producto
                      {getSortIndicator('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('totalQuantity')} disabled={isMinimalView}>
                      Cantidad Total
                      {getSortIndicator('totalQuantity')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button variant="ghost" onClick={() => requestSort('nextExpiryDate')} disabled={isMinimalView}>
                      Próxima Caducidad
                      {getSortIndicator('nextExpiryDate')}
                    </Button>
                  </TableHead>
                  <TableHead>Estado General</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const nextExpiryItem = product.inventory[0];
                    const overallStatus = nextExpiryItem ? getStatus(nextExpiryItem.expiryDate) : { label: 'Fresco', variant: 'default'};
                    const isOpen = openCollapsibles[product.id] || false;
                    
                    return (
                     <Collapsible asChild key={product.id} open={isOpen} onOpenChange={() => toggleCollapsible(product.id)}>
                        <>
                          <TableRow className="hover:bg-muted/50 cursor-pointer">
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <span className="sr-only">Ver lotes</span>
                                  </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium" onClick={() => toggleCollapsible(product.id)}>{product.name}</TableCell>
                            <TableCell onClick={() => toggleCollapsible(product.id)}>{product.totalQuantity.toLocaleString()} {product.unit}</TableCell>
                            <TableCell className="hidden md:table-cell" onClick={() => toggleCollapsible(product.id)}>
                              {nextExpiryItem ? format(nextExpiryItem.expiryDate, "MMM d, yyyy", { locale: es }) : '-'}
                            </TableCell>
                            <TableCell onClick={() => toggleCollapsible(product.id)}>
                                <Badge variant={overallStatus.variant} className="capitalize">
                                  {overallStatus.label}
                                </Badge>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                             <TableRow className="bg-muted/20 hover:bg-muted/30">
                                <TableCell colSpan={5} className="p-0">
                                  <div className="p-4">
                                    <h4 className="font-semibold mb-2 ml-4">Lotes de {product.name}</h4>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Cantidad</TableHead>
                                          <TableHead>Caduca</TableHead>
                                          <TableHead>Tiempo Restante</TableHead>
                                          <TableHead>Estado</TableHead>
                                          <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {product.inventory.map(item => {
                                          const status = getStatus(item.expiryDate);
                                          return (
                                            <TableRow key={item.id}>
                                              <TableCell>{item.quantity.toLocaleString()} {item.unit}</TableCell>
                                              <TableCell>{format(item.expiryDate, "MMM d, yyyy", { locale: es })}</TableCell>
                                              <TableCell>
                                                {formatDistanceToNowStrict(item.expiryDate, { addSuffix: true, locale: es })}
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant={status.variant} className="capitalize">
                                                  {status.label}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setItemToDelete({...item, productName: product.name})}>
                                                  <Trash2 className="h-4 w-4" />
                                                  <span className="sr-only">Eliminar</span>
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </TableCell>
                              </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente el lote de {itemToDelete?.quantity.toLocaleString()} {itemToDelete?.unit} de "{itemToDelete?.productName}" que caduca el {itemToDelete && format(itemToDelete.expiryDate, "PPP", { locale: es })}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  onDeleteInventoryItem(itemToDelete.id);
                  setItemToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
