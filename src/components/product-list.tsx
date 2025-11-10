"use client";

import { useState } from "react";
import { differenceInDays, format, formatDistanceToNowStrict } from "date-fns";
import { es } from 'date-fns/locale';
import { ArrowUpDown, Search, Trash2 } from "lucide-react";
import type { Product, SortConfig, SortKey } from "@/lib/types";
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

interface ProductListProps {
  products: Product[];
  onDeleteProduct: (id: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  sortConfig: SortConfig;
  onSortConfigChange: (config: SortConfig) => void;
}

export function ProductList({
  products,
  onDeleteProduct,
  searchTerm,
  onSearchTermChange,
  sortConfig,
  onSortConfigChange,
}: ProductListProps) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    onSortConfigChange({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const getStatus = (expiryDate: Date): { label: 'Caducado' | 'A punto de caducar' | 'Fresco', variant: 'destructive' | 'accent' | 'default', days: number } => {
    const days = differenceInDays(expiryDate, new Date());
    if (days < 0) return { label: 'Caducado', variant: 'destructive', days };
    if (days <= 7) return { label: 'A punto de caducar', variant: 'accent', days };
    return { label: 'Fresco', variant: 'default', days };
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <CardContent className="p-4">
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
          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Producto
                      {getSortIndicator('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('expiryDate')}>
                      Caduca
                      {getSortIndicator('expiryDate')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Tiempo Restante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const status = getStatus(product.expiryDate);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{format(product.expiryDate, "MMM d, yyyy", { locale: es })}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDistanceToNowStrict(product.expiryDate, { addSuffix: true, locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="capitalize">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
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

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará permanentemente "{productToDelete?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
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

const BadgeWithAccent = ({ variant, ...props }: { variant: 'destructive' | 'accent' | 'default' } & React.ComponentProps<typeof Badge>) => {
    if (variant === 'accent') {
        return <Badge className="bg-accent text-accent-foreground hover:bg-accent/80" {...props} />;
    }
    return <Badge variant={variant} {...props} />;
}
