"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Plus } from "lucide-react";

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
import { Calendar } from "@/components/ui/calendar";
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
import type { Product, Unit } from "@/lib/types";

const units: { value: Unit, label: string }[] = [
    { value: 'unidades', label: 'Unidades' },
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'g', label: 'Gramos (g)' },
    { value: 'lb', label: 'Libras (lb)' },
    { value: 'litros', label: 'Litros (l)' },
    { value: 'ml', label: 'Mililitros (ml)' },
];

const productFormSchema = z.object({
  product: z.object({
    id: z.string().optional(),
    name: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres."),
    unit: z.enum(['unidades', 'kg', 'g', 'lb', 'litros', 'ml']),
  }),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor que 0."),
  expiryDate: z.date({
    required_error: "Se requiere una fecha de caducidad.",
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface AddProductDialogProps {
  products: Product[];
  onProductAdd: (values: ProductFormValues) => void;
}

export function AddProductDialog({ products, onProductAdd }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      product: { name: "", unit: 'unidades' },
      quantity: 1,
    },
  });

  const selectedProduct = form.watch('product');

  function onSubmit(data: ProductFormValues) {
    onProductAdd(data);
    form.reset({ product: { name: "", unit: 'unidades' }, quantity: 1, expiryDate: undefined });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
          <DialogDescription>
            Introduce los detalles del producto a continuación. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Nombre del Producto</FormLabel>
                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value.name && "text-muted-foreground"
                            )}
                          >
                            {field.value.name
                              ? products.find(
                                  (p) => p.name.toLowerCase() === field.value.name.toLowerCase()
                                )?.name ?? field.value.name
                              : "Selecciona o crea un producto"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar producto..." 
                            onValueChange={(search) => {
                                // Keep the unit if a product was already selected
                                field.onChange({ ...field.value, name: search });
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>No se encontró el producto. Se creará uno nuevo.</CommandEmpty>
                            <CommandGroup>
                              {products.map((product) => (
                                <CommandItem
                                  value={product.name}
                                  key={product.id}
                                  onSelect={() => {
                                    form.setValue("product", product);
                                    setComboOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      product.id === field.value.id
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
               <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="p. ej., 1.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="product.unit"
                    render={({ field }) => (
                        <FormItem className='w-1/3'>
                        <FormLabel>Unidad</FormLabel>
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!!selectedProduct?.id}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Unidad" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {units.map(u => (
                                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Caducidad</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Elige una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Producto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
