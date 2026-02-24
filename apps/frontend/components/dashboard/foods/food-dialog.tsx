"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Food, Category, Ingredient, Printer } from "@/lib/api-types";
import { createFood, updateFood } from "@/actions/foods";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

const foodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  categoryId: z.string().min(1, "Select a category"),
  available: z.boolean(),
});

type FoodFormValues = z.input<typeof foodSchema>;

interface FoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: Food | null;
  categories: Category[];
  ingredients: Ingredient[];
  printers: Printer[];
  onSaved: (food: Food) => void;
  onDelete?: (food: Food) => void;
}

export function FoodDialog({
  open,
  onOpenChange,
  food,
  categories,
  ingredients,
  printers,
  onSaved,
  onDelete,
}: FoodDialogProps) {
  const isEditing = !!food;
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(foodSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: categories[0]?.id || "",
      available: true,
    },
  });

  useEffect(() => {
    if (food) {
      form.reset({
        name: food.name,
        description: food.description || "",
        price: food.price,
        categoryId: food.categoryId,
        available: food.available,
      });
      setSelectedIngredients(food.ingredients?.map(ing => ing.id) || []);
      setSelectedPrinterId(food.printerId || null);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: categories[0]?.id || "",
        available: true,
      });
      setSelectedIngredients([]);
      setSelectedPrinterId(null);
    }
    setIngredientSearch("");
  }, [food, open, categories, form]);

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  function toggleIngredient(ingredientId: string) {
    setSelectedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  }

  async function onSubmit(values: FoodFormValues) {
    try {
      const data = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        price: values.price as number,
        categoryId: values.categoryId,
        available: values.available,
        ingredients: selectedIngredients.map(id => ({ id })),
        printerId: selectedPrinterId,
      };

      if (isEditing && food) {
        const updated = await updateFood(food.id, data);
        onSaved(updated);
        toast.success("Food updated");
      } else {
        const created = await createFood(data);
        onSaved(created);
        toast.success("Food created");
      }
    } catch (error: any) {
      toast.error(error.message || "Error saving food");
    }
  }

  function handleDeleteConfirm() {
    if (food && onDelete) {
      setShowDeleteConfirm(false);
      onDelete(food);
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Food" : "New Food"}
            </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="py-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Name</FieldLabel>
                        <FormControl>
                          <Input {...field} placeholder="Food name" autoFocus />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3">
                  <FieldLabel htmlFor="available" className="mb-0">
                    Available
                  </FieldLabel>
                  <FormField
                    control={form.control}
                    name="available"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Checkbox
                            id="available"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <Field>
                        <FieldLabel>Description</FieldLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Optional description"
                            rows={3}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel>Price (€)</FieldLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={String(field.value ?? "")}
                              type="number"
                              autoComplete="off"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                            />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <Field>
                          <FieldLabel>Category</FieldLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />
                </div>

                <Accordion type="single" collapsible className="border rounded-xl">
                  <AccordionItem value="ingredients" className="border-none">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      Ingredients
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search..."
                            value={ingredientSearch}
                            onChange={(e) => setIngredientSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {filteredIngredients.map((ingredient) => {
                            const isSelected = selectedIngredients.includes(ingredient.id);
                            return (
                              <Badge
                                key={ingredient.id}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${isSelected
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                                  : "hover:bg-accent"
                                  }`}
                                onClick={() => toggleIngredient(ingredient.id)}
                              >
                                {ingredient.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="printer" className="border-none">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      Printer
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                      <div className="flex flex-wrap gap-2">
                        {printers.map((printer) => {
                          const isSelected = selectedPrinterId === printer.id;
                          return (
                            <Badge
                              key={printer.id}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${isSelected
                                ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                                : "hover:bg-accent"
                                }`}
                              onClick={() => setSelectedPrinterId(isSelected ? null : printer.id)}
                            >
                              {printer.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </FieldGroup>
              <DialogFooter>
                {isEditing && onDelete && food && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mr-auto"
                  >
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Save"
                      : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold">{food?.name}</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              variant="destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
