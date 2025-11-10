"use client";

import { useState } from "react";
import { differenceInDays, format, formatDistanceToNowStrict } from "date-fns";
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

  const getStatus = (expiryDate: Date): { label: 'Expired' | 'Expiring Soon' | 'Fresh', variant: 'destructive' | 'accent' | 'default', days: number } => {
    const days = differenceInDays(expiryDate, new Date());
    if (days < 0) return { label: 'Expired', variant: 'destructive', days };
    if (days <= 7) return { label: 'Expiring Soon', variant: 'accent', days };
    return { label: 'Fresh', variant: 'default', days };
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Sort controls could go here, but integrated into header for now */}
          </div>
          <div className="mt-4 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Product
                      {getSortIndicator('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('expiryDate')}>
                      Expires
                      {getSortIndicator('expiryDate')}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Time Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const status = getStatus(product.expiryDate);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{format(product.expiryDate, "MMM d, yyyy")}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDistanceToNowStrict(product.expiryDate, { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="capitalize">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No products found.
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
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{productToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (productToDelete) {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Custom badge variants in globals.css would be better, but for simplicity:
const badgeVariants = {
  accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
};

const CustomBadge = ({ variant, ...props }: any) => {
  const className = variant === 'accent' ? badgeVariants.accent : '';
  return <Badge variant={variant === 'accent' ? 'default' : variant} className={className} {...props} />;
};

// We need to extend Badge variants. For now, a simple trick in the component will do.
// A better solution would be to update the Badge component itself or tailwind config.
// The current Badge component doesn't have an "accent" variant. I'll dynamically assign colors.

const BadgeWithAccent = ({ variant, ...props }: { variant: 'destructive' | 'accent' | 'default' } & React.ComponentProps<typeof Badge>) => {
    if (variant === 'accent') {
        return <Badge className="bg-accent text-accent-foreground hover:bg-accent/80" {...props} />;
    }
    return <Badge variant={variant} {...props} />;
}
