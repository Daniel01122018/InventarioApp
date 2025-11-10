"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, ChevronsUpDown, MinusSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";
import type { ProductWithInventory, InventoryItem } from "@/lib/types";

const consumeFormSchema = z.object({
  productId: z.string().min(1, "Debes seleccionar un producto."),
  inventoryItemId: z.string().min(1, "Debes seleccionar un lote."),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor que 0."),
});

type ConsumeFormValues = z.infer<typeof consumeFormSchema>;

interface ConsumeProductDialogProps {
  productsWithInventory: ProductWithInventory[];
  onConsume: (inventoryItemId: string, quantity: number) => Promise<void>;
}

export function ConsumeProductDialog({ productsWithInventory, onConsume }: ConsumeProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [productComboOpen, setProductComboOpen] = useState(false);
  
  const form = useForm<ConsumeFormValues>({
    resolver: zodResolver(consumeFormSchema),
  });

  const selectedProductId = form.watch('productId');

  const selectedProduct = useMemo(() => {
    return productsWithInventory.find(p => p.id === selectedProductId);
  }, [selectedProductId, productsWithInventory]);

  async function onSubmit(data: ConsumeFormValues) {
    const inventoryItem = selectedProduct?.inventory.find(i => i.id === data.inventoryItemId);
    if (inventoryItem && data.quantity > inventoryItem.quantity) {
        form.setError("quantity", {
            type: "manual",
            message: `No puedes consumir más de ${inventoryItem.quantity} ${inventoryItem.unit}.`,
        });
        return;
    }

    await onConsume(data.inventoryItemId, data.quantity);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MinusSquare className="mr-2 h-4 w-4" />
          Usar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Usar Producto del Inventario</DialogTitle>
          <DialogDescription>
            Selecciona el producto y la cantidad que has utilizado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Producto</FormLabel>
                    <Popover open={productComboOpen} onOpenChange={setProductComboOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? productsWithInventory.find(
                                  (p) => p.id === field.value
                                )?.name
                              : "Selecciona un producto"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar producto..." />
                          <CommandList>
                            <CommandEmpty>No se encontró ningún producto.</CommandEmpty>
                            <CommandGroup>
                              {productsWithInventory.map((product) => (
                                <CommandItem
                                  value={product.name}
                                  key={product.id}
                                  onSelect={() => {
                                    form.setValue("productId", product.id);
                                    form.resetField("inventoryItemId");
                                    form.resetField("quantity");
                                    setProductComboOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      product.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {product.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProduct && (
                <>
                  <FormField
                    control={form.control}
                    name="inventoryItemId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lote (Cantidad y Caducidad)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un lote para consumir" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedProduct.inventory.map((item: InventoryItem) => (
                              <SelectItem key={item.id} value={item.id}>
                                {`${item.quantity} ${item.unit} - Caduca ${format(item.expiryDate, "P", { locale: es })}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad a Usar</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={`p. ej., 1.5 ${selectedProduct.unit}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!selectedProductId}>Confirmar Uso</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
