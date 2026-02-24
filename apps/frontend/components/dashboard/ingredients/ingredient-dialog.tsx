"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Ingredient } from "@/lib/api-types";
import { createIngredient, updateIngredient } from "@/actions/ingredients";
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
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

const ingredientSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: Ingredient | null;
  onSaved: (ingredient: Ingredient) => void;
  onDelete?: (ingredient: Ingredient) => void;
}

export function IngredientDialog({
  open,
  onOpenChange,
  ingredient,
  onSaved,
  onDelete,
}: IngredientDialogProps) {
  const isEditing = !!ingredient;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<IngredientFormValues>({
    resolver: standardSchemaResolver(ingredientSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name,
      });
    } else {
      form.reset({
        name: "",
      });
    }
  }, [ingredient, open, form]);

  async function onSubmit(values: IngredientFormValues) {
    try {
      if (isEditing && ingredient) {
        const updated = await updateIngredient(ingredient.id, {
          name: values.name.trim(),
        });
        onSaved(updated);
        toast.success("Ingredient updated");
      } else {
        const created = await createIngredient({ name: values.name.trim() });
        onSaved(created);
        toast.success("Ingredient created");
      }
    } catch (error: any) {
      toast.error(error.message || "Error saving ingredient");
    }
  }

  function handleDeleteConfirm() {
    if (ingredient && onDelete) {
      setShowDeleteConfirm(false);
      onDelete(ingredient);
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Ingredient" : "New Ingredient"}
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
                          <Input
                            {...field}
                            placeholder="Ingredient name"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </Field>
                    </FormItem>
                  )}
                />
              </FieldGroup>
              <DialogFooter>
                {isEditing && onDelete && ingredient && (
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
              Are you sure you want to delete the ingredient <span className="font-bold">{ingredient?.name}</span>?
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
